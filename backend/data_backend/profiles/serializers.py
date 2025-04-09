from rest_framework import serializers
from django.contrib.auth.models import User
from authentification.serializers import UserSerializer

from .models import Profile




class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        source='user',
        required=False
    )
    profile_picture_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'user_id', 'bio', 'profile_picture', 'profile_picture_url',
                 'date_of_birth', 'location', 'website', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'profile_picture_url']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture and hasattr(obj.profile_picture, 'url'):
            return self.context['request'].build_absolute_uri(obj.profile_picture.url)
        return None

    def validate_profile_picture(self, value):
        if value:
            # Check file size (limit to 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("Profile picture must be less than 5MB")

            # Check file extension
            valid_extensions = ['jpg', 'jpeg', 'png']
            extension = value.name.split('.')[-1].lower()
            if extension not in valid_extensions:
                raise serializers.ValidationError("Only JPG, JPEG, and PNG files are allowed")

        return value
