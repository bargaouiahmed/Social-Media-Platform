from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth.models import User

# Get the custom user model
CustomUser = User  # This returns your AUTH_USER_MODEL (CustomUser)

class CustomAccessToken(AccessToken):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        user_id = self.payload.get('user_id')

        if user_id:
            try:
                # Use your CustomUser model to fetch the user
                user = CustomUser.objects.get(id=user_id)

                # Add custom claims from your CustomUser
                self.payload['first_name']=user.first_name
                self.payload['last_name']=user.last_nam
                self.payload['email'] = user.email

                # Add other fields as needed
                # self.payload['is_staff'] = user.is_staff

            except CustomUser.DoesNotExist:
                return "User has not been found"
