from django.db import models
from django.contrib.auth.models import User

class SecurityQuestion(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='security_question')
    question = models.CharField(max_length=255)
    answer = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Security Question for {self.user.username}"
