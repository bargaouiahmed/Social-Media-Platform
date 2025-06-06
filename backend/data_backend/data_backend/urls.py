from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from socials.views import RelationshipViewSet, FriendViewSet, UserSearchViewSet
from authentification.views import (
    UserRegistrationView,
    CustomTokenObtainPairView,
    DeleteUserView,
    GetUserByUsernameView,
    CreateUpdateSecurityQuestionView,
    GetUserSecurityQuestionView,
    VerifySecurityAnswerView,
    ResetPasswordView,
    UpdateUserView
)
from posts.views import ReactionViewSet, PostViewSet, CommentViewSet, AttachmentViewSet
from profiles.views import ( ProfileCheck, ProfileCreateView, ProfileViewSet)
router = DefaultRouter()
router.register(r'relationships', RelationshipViewSet, basename='relationship')
router.register(r'friends', FriendViewSet, basename='friend')
router.register(r'users', UserSearchViewSet, basename='user-search')
router.register(r'posts', PostViewSet)
router.register(r'reactions', ReactionViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'attachments', AttachmentViewSet, basename='attachments')
router.register(r'profiles', ProfileViewSet, basename="profiles")

urlpatterns = [
    path('admin/', admin.site.urls),
    # Authentication endpoints
    path('api/token/', CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    #Profile management endpoints
    path('api/user/<int:user_id>/has-profile/', ProfileCheck.as_view(), name='profile-check'),
    path('api/user/has-profile/', ProfileCheck.as_view(), name='my-profile-check'),
    path('api/user/<int:user_id>/create-profile/', ProfileCreateView.as_view(), name='profile-create'),
    path('api/user/create-profile/', ProfileCreateView.as_view(), name='my-profile-create'),
    # User management endpoints
    path('api/user/register/', UserRegistrationView.as_view(), name='user_registration'),
    path('api/user/security-question/', CreateUpdateSecurityQuestionView.as_view(), name='security-question'),
    path('api/user/check-security/', GetUserSecurityQuestionView.as_view(), name='check-security-question'),
    path('api/user/verify-answer/', VerifySecurityAnswerView.as_view(), name='verify-security-answer'),
    path('api/user/password-reset/', ResetPasswordView.as_view(), name='password-reset'),
    path('api/user/update/', UpdateUserView.as_view(), name='user_update'),
    # User operations endpoints
    path('api/users/delete/', DeleteUserView.as_view(), name='user_delete'),
    path('api/users/get/', GetUserByUsernameView.as_view(), name='user_get'),

    # Include router URLs
    path('api/', include(router.urls)),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
