from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from .models import SecurityQuestion
from .serializers import (
    UserSerializer,
    CreateSecurityQuestionSerializer,
    SecurityQuestionCheckSerializer,
    SecurityAnswerSerializer,
    PasswordResetSerializer,
    CustomTokenObtainPairSerializer,
    UserUpdateSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class DeleteUserView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        username = request.data.get('username')

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
            )


class CreateUpdateSecurityQuestionView(generics.CreateAPIView):
    serializer_class = CreateSecurityQuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context


class GetUserSecurityQuestionView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SecurityQuestionCheckSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']

            try:
                user = User.objects.get(username=username)
                try:
                    security_question = SecurityQuestion.objects.get(user=user)
                    return Response({
                        'username': user.username,
                        'question': security_question.question
                    })
                except SecurityQuestion.DoesNotExist:
                    return Response(
                        {"detail": "No security question found for this user."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            except User.DoesNotExist:
                return Response(
                    {"detail": "User not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifySecurityAnswerView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SecurityAnswerSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            answer = serializer.validated_data['answer']

            try:
                user = User.objects.get(username=username)
                security_question = SecurityQuestion.objects.get(user=user)

                if security_question.answer.lower() == answer.lower():
                    return Response({
                        "detail": "Security answer verified.",
                        "verified": True
                    })
                else:
                    return Response({
                        "detail": "Incorrect security answer.",
                        "verified": False
                    }, status=status.HTTP_400_BAD_REQUEST)

            except (User.DoesNotExist, SecurityQuestion.DoesNotExist):
                return Response(
                    {"detail": "User or security question not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            answer = serializer.validated_data['answer']
            new_password = serializer.validated_data['new_password']

            try:
                user = User.objects.get(username=username)
                security_question = SecurityQuestion.objects.get(user=user)

                if security_question.answer.lower() == answer.lower():
                    user.set_password(new_password)
                    user.save()
                    return Response({
                        "detail": "Password has been reset successfully."
                    })
                else:
                    return Response({
                        "detail": "Incorrect security answer."
                    }, status=status.HTTP_400_BAD_REQUEST)

            except (User.DoesNotExist, SecurityQuestion.DoesNotExist):
                return Response(
                    {"detail": "User or security question not found."},
                    status=status.HTTP_404_NOT_FOUND
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class UpdateUserView(generics.UpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # This ensures users can only update their own profile
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)
