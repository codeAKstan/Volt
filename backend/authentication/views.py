from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import SignupSerializer, LoginSerializer, UserSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.views import APIView


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
                'first_name': user.first_name,
                'last_name': user.last_name,
                'name': f"{user.first_name} {user.last_name}",
                'phone_number': user.phone_number,
                'job_title': user.job_title,
                'department': user.department,
                'profile_image': request.build_absolute_uri(user.profile_image.url) if user.profile_image else None
            },
            'tokens': {
                'refresh': serializer.validated_data['refresh'],
                'access': serializer.validated_data['access']
            }
        }, status=status.HTTP_200_OK)

# Add UserProfileView for getting and updating the current user
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get(self, request):
        """Get the current user's profile"""
        serializer = UserSerializer(request.user)
        data = serializer.data
        
        # Add absolute URL for profile image if it exists
        if request.user.profile_image:
            data['profileImage'] = request.build_absolute_uri(request.user.profile_image.url)
        
        return Response(data)
    
    def patch(self, request):
        """Update the current user's profile"""
        # Handle both form data and JSON
        if request.content_type == 'application/json':
            data = request.data
        else:
            data = request.data.dict()
        
        # Convert camelCase to snake_case for backend
        if 'firstName' in data:
            data['first_name'] = data.pop('firstName')
        if 'lastName' in data:
            data['last_name'] = data.pop('lastName')
        if 'phoneNumber' in data:
            data['phone_number'] = data.pop('phoneNumber')
        if 'jobTitle' in data:
            data['job_title'] = data.pop('jobTitle')
        if 'profileImage' in data:
            data['profile_image'] = data.pop('profileImage')
        
        serializer = UserSerializer(request.user, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Add absolute URL for profile image if it exists
            response_data = serializer.data
            if request.user.profile_image:
                response_data['profileImage'] = request.build_absolute_uri(request.user.profile_image.url)
            
            return Response(response_data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
