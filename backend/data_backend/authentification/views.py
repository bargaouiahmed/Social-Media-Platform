from rest_framework import generics,status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated,AllowAny
from django.contrib.auth.models import User
from .serializers import UserSerializer
from .serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import  APIView




class UserRegistrationView(generics.CreateAPIView):
    queryset=User.objects.all()
    permission_classes=[AllowAny]
    serializer_class=UserSerializer
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]  # Or [AllowAny] if no login required

    def delete(self, request, *args, **kwargs):
        username = request.data.get('username')

        # Optional: Restrict deletion to own account or admin


        try:
            user = User.objects.get(username=username)
            user.delete()
            return Response(
                {"detail": "User deleted successfully."},
                status=status.HTTP_204_NO_CONTENT
            )
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )
class GetUserByUsernameView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        username = request.GET.get('username')
        try:
            user = User.objects.get(username=username)
            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
                )  # Return 404 if user not found
