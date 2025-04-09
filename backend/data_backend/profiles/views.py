from rest_framework import viewsets, status, permissions, parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User

from .models import Profile
from .serializers import ProfileSerializer

class ProfileCheck(APIView):
    """
    Endpoint to check if a user has a profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id=None):
        # If no user_id is provided, use the authenticated user
        if user_id is None:
            user_id = request.user.id

        # Check if the user exists
        user = get_object_or_404(User, id=user_id)

        # Check if the user has a profile
        has_profile = hasattr(user, 'profile')

        return Response({
            'user_id': user_id,
            'has_profile': has_profile
        })

class ProfileCreateView(APIView):
    """
    Endpoint to create an empty profile for a user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id=None):
        # If no user_id is provided, use the authenticated user
        if user_id is None:
            user_id = request.user.id

        # Check if the user exists
        user = get_object_or_404(User, id=user_id)

        # Check if the user already has a profile
        if hasattr(user, 'profile'):
            return Response(
                {'detail': 'User already has a profile.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create an empty profile
        profile = Profile.objects.create(user=user)

        # Serialize and return the profile
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Profile CRUD operations.
    """
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Add MultiPartParser for file uploads
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        # By default, only return the profile of the authenticated user
        return Profile.objects.filter(user=self.request.user)

    def get_serializer_context(self):
        """
        Add request to serializer context for building absolute URLs
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def retrieve(self, request, pk=None):
        # Allow retrieving profiles by user_id
        if pk and pk.isdigit():
            profile = get_object_or_404(Profile, user_id=pk)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return super().retrieve(request, pk)

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """
        Get the profile of the authenticated user.
        If the profile doesn't exist, return a 404.
        """
        user = request.user
        try:
            profile = Profile.objects.get(user=user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except Profile.DoesNotExist:
            return Response(
                {'detail': 'Profile not found for this user.'},
                status=status.HTTP_404_NOT_FOUND
            )

    def update(self, request, *args, **kwargs):
        # Ensure the user can only update their own profile
        instance = self.get_object()
        if instance.user != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to update this profile.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        # Ensure the user can only update their own profile
        instance = self.get_object()
        if instance.user != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to update this profile.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='upload-picture')
    def upload_picture(self, request, pk=None):
        """
        Dedicated endpoint for uploading profile pictures
        """
        profile = self.get_object()

        # Check permissions
        if profile.user != request.user and not request.user.is_staff:
            return Response(
                {'detail': 'You do not have permission to update this profile.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if image file is in request
        if 'profile_picture' not in request.FILES:
            return Response(
                {'detail': 'No image file provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the image file
        image_file = request.FILES['profile_picture']

        # Update the profile picture
        profile.profile_picture = image_file
        profile.save()

        # Return the updated profile
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
