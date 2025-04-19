from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import SignupSerializer, LoginSerializer, UserSerializer
from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.views import APIView
from booking.models import Booking
from booking.serializers import BookingSerializer


User = get_user_model()

# Update the SignupView to ensure it always returns JSON
class SignupView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = SignupSerializer
    permission_classes = [AllowAny]  # Make sure the user is authenticated
    
    def perform_create(self, serializer):
        # Get the validated data
        validated_data = serializer.validated_data
        
        # Check for admin role creation permission
        if validated_data.get('role') == 'ADMIN':
            if not self.request.user.is_authenticated or not self.request.user.is_superuser:
                raise serializers.ValidationError(
                    {"role": "Only existing administrators can create admin accounts."}
                )
        
        # Create the user
        user = serializer.save()
        
        return user
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
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
        except serializers.ValidationError as e:
            # Format validation errors for better frontend handling
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST, content_type='application/json')
    
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
        # Print request data for debugging
        print("Request data:", request.data)
        print("Request FILES:", request.FILES)
        
        # Create a serializer with the data
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            print("Serializer is valid, saving...")
            serializer.save()
            
            # Add absolute URL for profile image if it exists
            response_data = serializer.data
            if request.user.profile_image:
                response_data['profileImage'] = request.build_absolute_uri(request.user.profile_image.url)
            
            return Response(response_data)
        
        # Print validation errors for debugging
        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserListView(generics.ListAPIView):
    """
    API endpoint that allows all users to be viewed by admins.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only allow admins to see any user
        user = self.request.user
        if user.role == 'ADMIN' or user.is_superuser:
            return User.objects.all()
        # Non-admins can only see themselves
        return User.objects.filter(id=user.id)

class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    API endpoint that allows a specific user to be viewed or edited.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Only allow admins to see any user
        user = self.request.user
        if user.role == 'ADMIN' or user.is_superuser:
            return User.objects.all()
        # Non-admins can only see themselves
        return User.objects.filter(id=user.id)

class UserBookingsView(generics.ListAPIView):
    """
    API endpoint that allows viewing all bookings for a specific user.
    """
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user_id = self.kwargs.get('pk')
        # Only allow admins to see other users' bookings
        if self.request.user.role == 'ADMIN' or self.request.user.is_superuser or str(self.request.user.id) == user_id:
            return Booking.objects.filter(user_id=user_id)
        return Booking.objects.none()
