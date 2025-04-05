from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings


from rest_framework_simplejwt.views import(
    TokenRefreshView
)
from rest_framework.routers import DefaultRouter
from socials.views import RelationshipViewSet, FriendViewSet, UserSearchViewSet

from authentification.views import UserRegistrationView, CustomTokenObtainPairView,DeleteUserView,GetUserByUsernameView
from posts.views import ReactionViewSet,PostViewSet,CommentViewSet,AttachmentViewSet
# Create the router
router = DefaultRouter()
router.register(r'relationships', RelationshipViewSet, basename='relationship')
router.register(r'friends', FriendViewSet, basename='friend')
router.register(r'users', UserSearchViewSet, basename='user-search')
router.register(r'posts',PostViewSet)
router.register(r'reactions',ReactionViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'attachments', AttachmentViewSet, basename='attachments')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/register/', UserRegistrationView.as_view(), name='user_registration'),
    path('api/users/delete/', DeleteUserView.as_view(), name='user_delete'),
    path('api/users/get/', GetUserByUsernameView.as_view(), name='user_get'),
    # Include router URLs with the api/ prefix
    path('api/', include(router.urls)),
]
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
