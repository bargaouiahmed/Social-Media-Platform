from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Relationship
from authentification.serializers import UserSerializer
from django.db.models import Q

class RelationshipSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    sender_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        source='sender'
    )
    receiver_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        write_only=True,
        source='receiver'
    )
    class Meta:
        model = Relationship
        fields=['id','sender','receiver','sender_id','receiver_id','status','created_at','updated_at']
        read_only_fields=['created_at', 'updated_at']


class RelationshipActionSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()


class UserSearchSerializer(UserSerializer):  # Extends your existing UserSerializer
    relationship_status = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['id', 'relationship_status']

    def get_relationship_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        # Check existing relationships with correct comparison operators
        relationship = Relationship.objects.filter(
            Q(sender=request.user, receiver=obj) |
            Q(sender=obj, receiver=request.user)
        ).first()

        return relationship.status if relationship else 'none'
