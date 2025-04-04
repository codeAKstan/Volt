from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import SignupSerializer, LoginSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.views import TokenRefreshView


User = get_user_model()

class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        # Get the validated data
        validated_data = serializer.validated_data
        
        # Check for admin role creation permission
        if validated_data.get('role') == 'ADMIN':
            if not self.request.user.is_superuser:
                raise serializers.ValidationError(
                    {"role": "Only superusers can create admin accounts."}
                )
        
        # Create the user
        user = serializer.save()
 
        
        return user
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = self.perform_create(serializer)
        
        return Response(
            {
                "message": "User created successfully",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "name": f"{user.first_name} {user.last_name}"
                }
            },
            status=status.HTTP_201_CREATED,
            headers=self.get_success_headers(serializer.data)
        )
    
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        return Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'name': f"{user.first_name} {user.last_name}"
            },
            'tokens': {
                'refresh': serializer.validated_data['refresh'],
                'access': serializer.validated_data['access']
            }
        }, status=status.HTTP_200_OK)
