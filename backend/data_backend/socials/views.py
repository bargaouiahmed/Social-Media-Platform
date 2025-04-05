from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import Relationship
from .serializers import RelationshipSerializer, RelationshipActionSerializer,UserSearchSerializer
from authentification.serializers import UserSerializer
from django.db.models import Q

class RelationshipViewSet(viewsets.ModelViewSet):
    queryset = Relationship.objects.all()
    serializer_class = RelationshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter relationships to only show those involving the current user
        return Relationship.objects.get_user_relationships(self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get users from validated data
        sender = request.user
        receiver = serializer.validated_data['receiver']

        # Create the relationship
        relationship = Relationship.send_request(sender, receiver)

        if not relationship:
            return Response(
                {"error": "Cannot send request to yourself or request already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Return the created relationship
        result_serializer = self.get_serializer(relationship)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=['post'])
    def unfriend(self, request, pk=None):
        relationship = self.get_object()

    # Check if user is involved in the relationship
        if request.user not in [relationship.sender, relationship.receiver]:
            return Response(
                {"error": "You cannot unfriend users in relationships you're not a part of"},
                status=status.HTTP_403_FORBIDDEN
            )

    # Use the model's unfriend method
        success = relationship.unfriend()
        if success:
            return Response({"message": "Successfully unfriended"}, status=status.HTTP_200_OK)
        return Response(
            {"error": "Cannot unfriend - relationship is not in 'accepted' status"},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        relationship = self.get_object()

        # Only the receiver can accept the request
        if relationship.receiver != request.user:
            return Response(
                {"error": "Only the receiver can accept a friend request"},
                status=status.HTTP_403_FORBIDDEN
            )

        success = relationship.accept()
        if success:
            serializer = self.get_serializer(relationship)
            return Response(serializer.data)
        return Response(
            {"error": "Cannot accept this request"},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        relationship = self.get_object()

        # Only the receiver can reject the request
        if relationship.receiver != request.user:
            return Response(
                {"error": "Only the receiver can reject a friend request"},
                status=status.HTTP_403_FORBIDDEN
            )

        success = relationship.reject()
        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(
            {"error": "Cannot reject this request"},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        relationship = self.get_object()

        # Check if user is involved in the relationship
        if request.user not in [relationship.sender, relationship.receiver]:
            return Response(
                {"error": "You cannot block users in relationships you're not a part of"},
                status=status.HTTP_403_FORBIDDEN
            )

        success = relationship.block()
        if success:
            serializer = self.get_serializer(relationship)
            return Response(serializer.data)
        return Response(
            {"error": "Cannot block this user"},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def unblock(self, request, pk=None):
        relationship = self.get_object()

        # Check if user is involved in the relationship
        if request.user not in [relationship.sender, relationship.receiver]:
            return Response(
                {"error": "You cannot unblock users in relationships you're not a part of"},
                status=status.HTTP_403_FORBIDDEN
            )

        success = relationship.unblock()
        if success:
            serializer = self.get_serializer(relationship)
            return Response(serializer.data)
        return Response(
            {"error": "Cannot unblock this user"},
            status=status.HTTP_400_BAD_REQUEST
        )

class FriendViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """List all friends of the current user"""
        friends = Relationship.objects.get_friends(request.user)
        serializer = UserSerializer(friends, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending_requests(self, request):
        """List all pending friend requests for the current user"""
        pending = Relationship.objects.get_pending_requests(request.user)
        serializer = RelationshipSerializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def send_request(self, request):
        """Send a friend request"""
        serializer = RelationshipActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the target user
        receiver = get_object_or_404(User, pk=serializer.validated_data['user_id'])

        # Create the relationship
        relationship = Relationship.send_request(request.user, receiver)

        if not relationship:
            return Response(
                {"error": "Cannot send request to yourself or request already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result_serializer = RelationshipSerializer(relationship)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def check_friendship(self, request):
        """Check if two users are friends"""
        serializer = RelationshipActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the target user
        other_user = get_object_or_404(User, pk=serializer.validated_data['user_id'])

        # Check friendship status
        are_friends = Relationship.objects.are_friends(request.user, other_user)

        return Response({"are_friends": are_friends})




class UserSearchViewSet(viewsets.GenericViewSet):
    queryset = User.objects.all()
    serializer_class = UserSearchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user
        existing_relationships = Relationship.objects.get_user_relationships(user)
        existing_user_ids = [user.id] + [
            rel.sender.id if rel.sender != user else rel.receiver.id for rel in existing_relationships
        ]
        queryset = User.objects.exclude(id__in=existing_user_ids)
        search_query = request.query_params.get('search', None)

        if search_query:
            queryset = queryset.filter(
                Q(username__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)
