from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q

# Create your models here.

class RelationshipManager(models.Manager):
    def get_user_relationships(self, user):
        """Get all relationships where the user is either sender or receiver"""
        return self.filter(
            Q(sender=user) | Q(receiver=user)
        )

    def get_friends(self, user):
        """Get all users who have an accepted relationship with the given user"""
        relationships = self.filter(
            (Q(sender=user) | Q(receiver=user)) & Q(status='accepted')
        )
        friends = []
        for relationship in relationships:
            if relationship.sender == user:
                friends.append(relationship.receiver)
            else:
                friends.append(relationship.sender)
        return friends

    def get_pending_requests(self, user):
        """Get all pending friend requests received by the user"""
        return self.filter(receiver=user, status='pending')

    def are_friends(self, user1, user2):
        """Check if two users are friends"""
        return self.filter(
            ((Q(sender=user1) & Q(receiver=user2)) |
             (Q(sender=user2) & Q(receiver=user1))) &
            Q(status='accepted')
        ).exists()


class Relationship(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('blocked', 'Blocked')
    ]

    sender = models.ForeignKey(User,
                               on_delete=models.CASCADE,
                               related_name="sent_request")
    receiver = models.ForeignKey(User,
                                 on_delete=models.CASCADE,
                                 related_name="received_request")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Add custom manager
    objects = RelationshipManager()

    class Meta:
        unique_together = ['sender', 'receiver']
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.sender.username} -> {self.receiver.username} ({self.get_status_display()})"

    def accept(self):
        """Accept a relationship request"""
        if self.status == 'pending':
            self.status = 'accepted'
            self.save()
            return True
        return False

    def reject(self):
        """Reject/delete a relationship request"""
        if self.status == 'pending':
            self.delete()
            return True
        return False

    def block(self):
        """Block a user"""
        self.status = 'blocked'
        self.save()
        return True

    def unblock(self):
        """Unblock a user"""
        if self.status == 'blocked':
            self.status = 'accepted'
            self.save()
            return True
        return False
    def unfriend(self):
        """Unfriend a user"""
        if self.status=="accepted":
            self.delete()
            return True
        return False

    @classmethod
    def send_request(cls, from_user, to_user):
        """Create a new friend request"""
        if from_user == to_user:
            return None

        # Check if there's an existing relationship
        existing = cls.objects.filter(
            (Q(sender=from_user) & Q(receiver=to_user)) |
            (Q(sender=to_user) & Q(receiver=from_user))
        ).first()

        if existing:
            return existing

        # Create new relationship
        return cls.objects.create(sender=from_user, receiver=to_user)
