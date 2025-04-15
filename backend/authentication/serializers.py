from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class SignupSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email',
            'password', 'password2', 'role',
            'phone_number'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True}
        }
    
    def validate(self, attrs):
        # Password confirmation validation
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2', None)
        
        user = User.objects.create_user(**validated_data)
        return user
    

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True, style={'input_type': 'password'})

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            from django.contrib.auth import authenticate
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            
            if not user:
                raise serializers.ValidationError({'error': 'Invalid credentials'})
            
            if not user.is_active:
                raise serializers.ValidationError({'error': 'User account is disabled'})
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return {
                'user': user,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        else:
            raise serializers.ValidationError({'error': 'Must include "email" and "password"'})

# Add UserSerializer for the profile endpoint
class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    phoneNumber = serializers.CharField(source='phone_number', required=False, allow_blank=True, allow_null=True)
    jobTitle = serializers.CharField(source='job_title', required=False, allow_blank=True, allow_null=True)
    profileImage = serializers.ImageField(source='profile_image', required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'firstName', 'lastName', 
            'name', 'role', 'phone_number', 'phoneNumber', 'job_title', 'jobTitle',
            'department', 'profile_image', 'profileImage'
        ]
        read_only_fields = ['id', 'email', 'role']
    
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
        
    def update(self, instance, validated_data):
        # Handle nested source fields
        if 'first_name' in validated_data:
            instance.first_name = validated_data.pop('first_name')
        if 'last_name' in validated_data:
            instance.last_name = validated_data.pop('last_name')
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data.pop('phone_number')
        if 'job_title' in validated_data:
            instance.job_title = validated_data.pop('job_title')
        if 'profile_image' in validated_data:
            instance.profile_image = validated_data.pop('profile_image')
            
        # Update remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance
