from rest_framework import serializers
from django.contrib.auth.models import User
from .models import SecurityQuestion
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2=serializers.CharField(write_only=True,required=True)
    class Meta:
        model = User
        fields = ["id",'username','password','password2','email','first_name','last_name']
        extra_kwargs = {
            'first_name':{"required":False},
            'last_name':{"required":False},
            'email':{"required":True}
        }


    def validate(self, attrs):
        if attrs['password']!=attrs['password2']:
             raise serializers.ValidationError({"password":"password fields didn't match"})
        return attrs
    def create(self,validated_data):
        password2=validated_data.pop('password2',None)
        print(validated_data)
        user=User.objects.create_user(**validated_data)
        return user
    def delete(self,validate_data):
        user=User.objects.get(username=validate_data['username'])
        user.delete()
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make the username field optional since we'll be using email
        self.fields['username'].required = False
        # Add email field
        self.fields['email'] = serializers.EmailField(required=False)

    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')
        password = attrs.get('password')

        # Check if either email or username is provided
        if not (email or username):
            raise serializers.ValidationError('Either email or username is required.')

        # Find user by email or username
        if email:
            try:
                user = User.objects.get(email=email)
                # Important: Set the username in attrs since the parent class expects it
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError('No user found with this email.')



        if not password:
            raise serializers.ValidationError('Password is required.')

        # Now call the parent's validate method with the username set
        return super().validate(attrs)
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['first_name']=user.first_name
        token['last_name']=user.last_name
        token['email']=user.email
        return token
from rest_framework import serializers
from .models import SecurityQuestion

class SecurityQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityQuestion
        fields = ['question', 'answer']
        extra_kwargs = {
            'answer': {'write_only': True}  # For security, answers should never be returned in responses
        }

class CreateSecurityQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityQuestion
        fields = ['question', 'answer']

    def create(self, validated_data):
        user = self.context['request'].user
        # Check if user already has a security question
        try:
            security_question = SecurityQuestion.objects.get(user=user)
            # Update existing
            security_question.question = validated_data['question']
            security_question.answer = validated_data['answer']
            security_question.save()
        except SecurityQuestion.DoesNotExist:
            # Create new
            security_question = SecurityQuestion.objects.create(
                user=user,
                **validated_data
            )
        return security_question

class SecurityQuestionCheckSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)

class SecurityAnswerSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    answer = serializers.CharField(required=True)

class PasswordResetSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    answer = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match"})
        return attrs
class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email']

    def validate_username(self, value):
        # Skip validation if username is unchanged
        if self.instance and self.instance.username == value:
            return value

        # Check if username is already taken
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value
