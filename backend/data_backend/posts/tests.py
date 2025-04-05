from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework import status
from .models import Post, Reaction
from .views import PostViewSet, ReactionViewSet
import json

class PostAPITestCase(TestCase):
    def setUp(self):
        # Create test users
        self.user1 = User.objects.create_user(username='testuser1', password='password123')
        self.user2 = User.objects.create_user(username='testuser2', password='password123')

        # Create test posts
        self.post1 = Post.objects.create(
            title='Test Post 1',
            content='This is a test post content',
            author=self.user1
        )

        self.post2 = Post.objects.create(
            title='Test Post 2',
            content='Another test post content',
            author=self.user2
        )

        # Set up API client and factory
        self.client = APIClient()
        self.factory = APIRequestFactory()

    def test_list_posts(self):
        # Use the viewset directly instead of URL
        view = PostViewSet.as_view({'get': 'list'})
        request = self.factory.get('/api/posts/')
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)  # Adjust if you're using pagination

    def test_create_post(self):
        # Use the viewset directly
        view = PostViewSet.as_view({'post': 'create'})
        data = {
            'title': 'New Post',
            'content': 'This is a new post created via API'
        }
        request = self.factory.post('/api/posts/', data)
        force_authenticate(request, user=self.user1)
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Post.objects.count(), 3)
        self.assertEqual(Post.objects.latest('created_at').title, 'New Post')

    def test_react_to_post(self):
        # Use the action from the viewset
        view = ReactionViewSet.as_view({'post': 'react'})
        data = {
            'post': self.post2.id,
            'reaction': 'like'
        }
        request = self.factory.post('/api/reactions/react/', data)
        force_authenticate(request, user=self.user1)
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Check if reaction was created
        reaction = Reaction.objects.filter(user=self.user1, post=self.post2).first()
        self.assertIsNotNone(reaction)
        self.assertEqual(reaction.reaction, 'like')

    def test_unreact_to_post(self):
        # First create a reaction
        Reaction.objects.create(
            user=self.user1,
            post=self.post2,
            reaction='like'
        )

        # Use the action from the viewset
        view = ReactionViewSet.as_view({'post': 'unreact'})
        data = {
            'post': self.post2.id
        }
        request = self.factory.post('/api/reactions/unreact/', data)
        force_authenticate(request, user=self.user1)
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        # Check if reaction was deleted
        reaction = Reaction.objects.filter(user=self.user1, post=self.post2).first()
        self.assertIsNone(reaction)
