# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Reaction, Comment, Attachment
from authentification.serializers import UserSerializer
from django.db.models import Count
from django.core.validators import FileExtensionValidator

# Use this for circular reference issues
class ReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        source='user'
    )
    post_id = serializers.PrimaryKeyRelatedField(
        queryset=Post.objects.all(),
        write_only=True,
        source='post'
    )

    class Meta:
        model = Reaction
        fields = ['id', 'reaction', 'user', 'user_id', 'post_id', 'post']
        read_only_fields = ['id', 'post']
        extra_kwargs = {'post': {'read_only': True}}

class ReactionCountSerializer(serializers.Serializer):
    reaction = serializers.CharField()
    count = serializers.IntegerField()

class AttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = Attachment
        fields = ['id', 'post', 'file', 'file_type', 'created_at', 'file_url', 'thumbnail_url']
        read_only_fields = ['id', 'file_type', 'created_at', 'file_url', 'thumbnail_url']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request is not None:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail and request is not None:
            return request.build_absolute_uri(obj.thumbnail.url)
        return None

class AttachmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ['id', 'post', 'file']
        read_only_fields = ['id']
        extra_kwargs = {
            'file': {
                'validators': [
                    FileExtensionValidator(allowed_extensions=[
                        'jpg', 'jpeg', 'png', 'gif',
                        'mp4', 'mov', 'avi', 'pdf'
                    ])
                ]
            }
        }

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f'File too large. Size should not exceed {max_size//1024//1024}MB.'
            )
        return value

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        source='user'
    )
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'post', 'content', 'user', 'user_id',
                 'parent', 'created_at', 'updated_at', 'edited',
                 'deleted', 'replies']
        read_only_fields = ['id', 'created_at', 'updated_at', 'edited']

    def get_replies(self, obj):
        if hasattr(obj, 'replies'):
            return CommentSerializer(obj.replies.filter(deleted=False), many=True).data
        return []

class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'post', 'content', 'parent']
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        source='author'
    )
    reactions = ReactionSerializer(source='reaction_set', many=True, read_only=True)
    reaction_counts = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'author', 'author_id',
                 'created_at', 'updated_at', 'reactions',
                 'reaction_counts', 'user_reaction', 'comments_count']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_reaction_counts(self, obj):
        counts = obj.reaction_set.values('reaction').annotate(count=Count('id'))
        return ReactionCountSerializer(counts, many=True).data

    def get_user_reaction(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            reaction = obj.reaction_set.filter(user=request.user).first()
            return reaction.reaction if reaction else None
        return None

    def get_comments_count(self, obj):
        return obj.comments.filter(deleted=False).count()

class PostSerializerWithAttachments(PostSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)

    class Meta(PostSerializer.Meta):
        fields = PostSerializer.Meta.fields + ['attachments']

class PostDetailSerializer(PostSerializerWithAttachments):
    comments = serializers.SerializerMethodField()

    class Meta(PostSerializerWithAttachments.Meta):
        fields = PostSerializerWithAttachments.Meta.fields + ['comments']

    def get_comments(self, obj):
        comments = Comment.objects.get_comments_for_post(obj)
        return CommentSerializer(comments, many=True).data

class PostCreateUpdateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(
        child=serializers.FileField(max_length=100000, allow_empty_file=False),
        write_only=True,
        required=False
    )

    class Meta:
        model = Post
        fields = ['id', 'title', 'content', 'attachments']
        read_only_fields = ['id']

    def create(self, validated_data):
        attachments_data = validated_data.pop('attachments', [])
        post = Post.objects.create(**validated_data)

        if attachments_data:
            # Handle each attachment individually instead of bulk_create
            for attachment_file in attachments_data:
                Attachment.objects.create(post=post, file=attachment_file)

        return post

    def update(self, instance, validated_data):
        attachments_data = validated_data.pop('attachments', None)

        # Update basic post fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Handle attachments if provided
        if attachments_data is not None:
            # Delete existing attachments
            instance.attachments.all().delete()

            # Create new attachments one by one
            for attachment_file in attachments_data:
                Attachment.objects.create(post=instance, file=attachment_file)

        return instance
