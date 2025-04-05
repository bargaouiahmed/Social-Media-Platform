from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from .models import Post, Reaction,Comment, Attachment
from .serializers import (
    PostSerializer, PostDetailSerializer, PostCreateUpdateSerializer,
    ReactionSerializer,CommentCreateSerializer,CommentSerializer,AttachmentSerializer,PostSerializerWithAttachments
)
class IsPostAuthorOrReadOnly(permissions.BasePermission):
    """
    Permission for attachments - checks the parent post's author
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.post.author == request.user
class IsAuthorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow authors of a post to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user

class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for viewing, creating, editing, and deleting posts.
    """
    queryset = Post.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at']
    filterset_fields = ['author']
    pagination_class = None  # Disable pagination

    def get_queryset(self):
        queryset = Post.objects.all().select_related('author').prefetch_related(
            Prefetch('reaction_set', queryset=Reaction.objects.select_related('user'))
        )

        if user_id := self.request.query_params.get('user_id'):
            queryset = queryset.filter(author_id=user_id)
        if search_query := self.request.query_params.get('search'):
            queryset = Post.objects.search(search_query)

        return queryset

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PostDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PostCreateUpdateSerializer
        return PostSerializerWithAttachments

    def perform_create(self, serializer):
        # Simply save the post with author, the serializer will handle attachments
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        # Let the serializer handle attachments
        serializer.save()

    @action(detail=True, methods=['get'])
    def reactions(self, request, pk=None):
        """Get all reactions for a specific post."""
        post = self.get_object()
        reactions = post.reaction_set.select_related('user')
        return Response(ReactionSerializer(reactions, many=True).data)

    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Get all posts created by the authenticated user."""
        posts = Post.objects.filter(author=request.user).select_related('author')
        return Response(self.get_serializer(posts, many=True).data)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>\d+)')
    def user_posts(self, request, user_id):
        """Get all posts created by a specific user."""
        user = get_object_or_404(User, pk=user_id)
        posts = Post.objects.filter(author=user).select_related('author')
        return Response(self.get_serializer(posts, many=True).data)
class ReactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reactions to posts.
    """
    queryset = Reaction.objects.all()
    serializer_class = ReactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination

    def get_queryset(self):
        return Reaction.objects.filter(user=self.request.user)\
                             .select_related('post', 'user')\
                             .order_by('-id')

    def create(self, request, *args, **kwargs):
        request.data.setdefault('user_id', request.user.id)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def react(self, request):
        """Create or update a reaction to a post."""
        post_id = request.data.get('post')
        reaction_type = request.data.get('reaction')

        if not post_id or not reaction_type:
            return Response(
                {"error": "Both post and reaction are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        post = get_object_or_404(Post, id=post_id)
        reaction = Reaction.objects.set_reaction(
            user=request.user,
            post=post,
            reaction_type=reaction_type
        )

        if not reaction:
            return Response(
                {"error": f"Invalid reaction type. Choose from: {dict(Reaction.REACT_CHOICES)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(self.get_serializer(reaction[0]).data)

    @action(detail=False, methods=['post'])
    def unreact(self, request):
        """Remove a reaction from a post."""
        if not (post_id := request.data.get('post')):
            return Response(
                {"error": "Post ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        post = get_object_or_404(Post, id=post_id)
        deleted_count, _ = Reaction.objects.delete_reaction(user=request.user, post=post)

        if not deleted_count:
            return Response(
                {"message": "No reaction found to delete"},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing comments on posts.
    """
    queryset = Comment.objects.filter(deleted=False)
    serializer_class = CommentCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        """
        Customize the queryset based on query parameters.
        - Can filter by post_id
        - Excludes deleted comments by default
        """
        queryset = Comment.objects.filter(deleted=False).select_related('user', 'post')

        # Filter by post_id if provided
        if post_id := self.request.query_params.get('post_id'):
            queryset = Comment.objects.get_comments_for_post(
                post_id=post_id,
                include_deleted=False
            )
        # Filter to get user's comments
        elif user_id := self.request.query_params.get('user_id'):
            user = get_object_or_404(User, pk=user_id)
            queryset = Comment.objects.get_user_comments(
                user=user,
                include_deleted=False
            )

        return queryset

    def get_serializer_class(self):
        """Return appropriate serializer based on the action"""
        if self.action in ['create', 'update', 'partial_update']:
            return CommentCreateSerializer
        return CommentCreateSerializer

    def create(self, request, *args, **kwargs):
        """Create a new comment or reply"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Use the manager's create_comment method
        comment = Comment.objects.create_comment(
            user=request.user,
            post_id=serializer.validated_data['post'].id,
            content=serializer.validated_data['content'],
            parent=serializer.validated_data.get('parent')
        )

        serializer = CommentCreateSerializer(comment)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a comment with permission checks"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        # Check if user can edit this comment
        if instance.user != request.user:
            return Response(
                {"error": "You can only edit your own comments"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # Use the manager's edit_comment method
        try:
            comment = Comment.objects.edit_comment(
                user=request.user,
                comment_id=instance.id,
                new_content=serializer.validated_data['content']
            )
            serializer = CommentCreateSerializer(comment)
            return Response(serializer.data)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)

    def destroy(self, request, *args, **kwargs):
        """Delete a comment (soft delete by default)"""
        instance = self.get_object()

        # Determine if this should be a hard delete
        hard_delete = request.query_params.get('hard_delete') == 'true'
        if hard_delete and not request.user.has_perm('app.can_moderate'):
            return Response(
                {"error": "You don't have permission to permanently delete comments"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            Comment.objects.delete_comment(
                user=request.user,
                comment_id=instance.id,
                soft_delete=not hard_delete
            )
            return Response(status=status.HTTP_204_NO_CONTENT)
        except PermissionError as e:
            return Response({"error": str(e)}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['get'])
    def my_comments(self, request):
        """Get all comments by the authenticated user (non-deleted only)"""
        comments = Comment.objects.get_user_comments(
            user=request.user,
            include_deleted=False
        )
        serializer = CommentCreateSerializer(comments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='post/(?P<post_id>\\d+)')
    def post_comments(self, request, post_id=None):
        """Get all comments for a specific post (non-deleted only)"""
        post = get_object_or_404(Post, pk=post_id)
        comments = Comment.objects.get_comments_for_post(
            post=post,
            include_deleted=False
        ).select_related('user')
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)


class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = Attachment.objects.all()
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsPostAuthorOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        return Attachment.objects.filter(post__author=self.request.user)

    def create(self, request, *args, **kwargs):
        # Expect post_id in the request data
        post_id = request.data.get('post')
        if not post_id:
            return Response(
                {"error": "post field is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        post = get_object_or_404(Post, pk=post_id)
        if post.author != request.user:
            return Response(
                {"error": "You don't own this post"},
                status=status.HTTP_403_FORBIDDEN
            )

        files = request.FILES.getlist('file')
        if not files:
            return Response(
                {"error": "No files provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        attachments = []
        for file in files:
            attachment = Attachment(post=post, file=file)
            attachment.save()
            attachments.append(attachment)

        return Response(
            AttachmentSerializer(attachments, many=True).data,
            status=status.HTTP_201_CREATED
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
