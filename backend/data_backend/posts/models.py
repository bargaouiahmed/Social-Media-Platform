from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q, Prefetch, Count
from django.utils import timezone
from django.core.validators import FileExtensionValidator
from django.core.files.base import ContentFile
import magic
import os
import cv2
from PIL import Image

class PostManager(models.Manager):
    def search(self, query):
        return self.filter(
            Q(title__icontains=query) |
            Q(content__icontains=query)
        ).distinct()

    def get_posts_by_user(self, user):
        return self.filter(author=user).select_related('author').order_by('-created_at')

    def get_reactions_and_users(self):
        return self.prefetch_related(
            Prefetch('reaction_set',
                   queryset=Reaction.objects.select_related('user'))
        )

    def get_posts_with_attachments(self):
        return self.prefetch_related('attachments')

    def get_post_with_attachments(self, post_id):
        return self.filter(id=post_id).prefetch_related('attachments').first()

class Post(models.Model):
    title = models.CharField(max_length=50)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = PostManager()

    class Meta:
        ordering = ['-created_at']

class ReactionManager(models.Manager):
    def set_reaction(self, user, post, reaction_type):
        if reaction_type not in dict(Reaction.REACT_CHOICES):
            return None
        return self.update_or_create(
            user=user,
            post=post,
            defaults={'reaction': reaction_type}
        )

    def delete_reaction(self, user, post):
        return self.filter(user=user, post=post).delete()

    def get_reaction(self, user, post):
        return self.filter(user=user, post=post).first()

class Reaction(models.Model):
    REACT_CHOICES = [
        ('like', 'Like'),
        ('love', 'Love'),
        ('dislike', 'Dislike'),
        ('hate', 'Hate')
    ]
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    reaction = models.CharField(max_length=10, choices=REACT_CHOICES)
    objects = ReactionManager()

    class Meta:
        unique_together = ['user', 'post']

class CommentManager(models.Manager):
    def get_comments_for_post(self, post, include_deleted=False):
        qs = self.filter(post=post, parent__isnull=True)
        if not include_deleted:
            qs = qs.filter(deleted=False)
        return qs.select_related('user').prefetch_related(
            Prefetch('replies',
                   queryset=Comment.objects.filter(deleted=False)
                   .select_related('user'))
        )

    def create_comment(self, user, post_id, content, parent=None):
        return self.create(
            user=user,
            post_id=post_id,
            content=content,
            parent=parent
        )

    def edit_comment(self, user, comment_id, new_content):
        comment = self.get(pk=comment_id)
        if comment.user != user:
            raise PermissionError("You can only edit your own comments")
        comment.content = new_content
        comment.edited = True
        comment.save()
        return comment

    def delete_comment(self, user, comment_id, soft_delete=True):
        comment = self.get(pk=comment_id)
        if comment.user != user and not user.has_perm('app.can_moderate'):
            raise PermissionError("You don't have permission to delete this comment")
        if soft_delete:
            comment.soft_delete(user)
        else:
            comment.delete()
        return comment

    def get_user_comments(self, user, include_deleted=False):
        qs = self.filter(user=user)
        if not include_deleted:
            qs = qs.filter(deleted=False)
        return qs.order_by('-created_at')

class Comment(models.Model):
    post = models.ForeignKey('Post', on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    edited = models.BooleanField(default=False)
    deleted = models.BooleanField(default=False)
    deleted_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='deleted_comments'
    )
    deleted_at = models.DateTimeField(null=True, blank=True)
    objects = CommentManager()

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'parent']),
            models.Index(fields=['created_at']),
        ]
        permissions = [
            ('can_moderate', 'Can delete any comment'),
        ]

    def __str__(self):
        return f"{self.user.username}: {self.content[:50]}"

    def is_edited(self):
        return self.edited and (self.updated_at - self.created_at).total_seconds() > 60

    def soft_delete(self, user):
        self.deleted = True
        self.deleted_by = user
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.deleted = False
        self.deleted_by = None
        self.deleted_at = None
        self.save()

class AttachmentManager(models.Manager):
    def bulk_create_for_post(self, post, files):
        """
        Creates attachments for a post one by one to ensure proper file handling.
        """
        attachments = []
        for file in files:
            try:
                # Create and save each attachment individually
                attachment = self.model(post=post, file=file)
                attachment.save()
                attachments.append(attachment)
            except Exception as e:
                print(f"Error creating attachment: {str(e)}")
                # Continue with other files even if one fails
                continue

        return attachments


    def get_for_post(self, post):
        return self.filter(post=post).select_related('post')

    def delete_from_post(self, post, attachment_ids):
        return self.filter(post=post, id__in=attachment_ids).delete()

    def update_post_attachments(self, post, new_files, attachments_to_remove=None):
        if attachments_to_remove:
            self.filter(post=post, id__in=attachments_to_remove).delete()
        if new_files:
            return self.bulk_create_for_post(post, new_files)
        return None
class Attachment(models.Model):
    FILE_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('other', 'Other'),
    )
    post = models.ForeignKey('Post', related_name='attachments', on_delete=models.CASCADE)
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/%d/', null=True, blank=True)
    objects = AttachmentManager()

    class Meta:
        ordering = ['created_at']

    # models.py (Attachment model)
def save(self, *args, **kwargs):
    # First save to move file to permanent storage
    super().save(*args, **kwargs)

    # Detect file type after file is saved
    if not self.file_type:
        self.detect_file_type()
        self.save(update_fields=['file_type'])  # Update file_type field

    # Generate thumbnail using permanent file path
    if self.file_type == 'video' and not self.thumbnail:
        self.generate_video_thumbnail()

def detect_file_type(self):
    with open(self.file.path, 'rb') as f:
        file_data = f.read(1024)

    mime = magic.Magic(mime=True)
    file_mime = mime.from_buffer(file_data)
    if file_mime.startswith('image/'):
        self.file_type = 'image'
    elif file_mime.startswith('video/'):
        self.file_type = 'video'
    else:
        self.file_type = 'other'

def generate_video_thumbnail(self):
    temp_path = 'temp_thumbnails'
    os.makedirs(temp_path, exist_ok=True)

    # Use the final file path from MEDIA_ROOT
    vidcap = cv2.VideoCapture(self.file.path)
    success, image = vidcap.read()

    if success:
        temp_image_path = os.path.join(temp_path, f'thumb_{self.id}.jpg')
        cv2.imwrite(temp_image_path, image)

        with open(temp_image_path, 'rb') as f:
            self.thumbnail.save(
                f'thumb_{os.path.basename(self.file.name)}.jpg',
                ContentFile(f.read()),
                save=False
            )

        os.remove(temp_image_path)
        self.save(update_fields=['thumbnail'])
