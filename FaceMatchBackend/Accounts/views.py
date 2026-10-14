from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from Accounts.serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
)

User = get_user_model()


def _build_token_pair(user):
    """Return a dict with signed refresh + access tokens and embedded claims."""
    refresh = RefreshToken.for_user(user)
    refresh["role"]     = user.role
    refresh["username"] = user.username
    return {
        "refresh": str(refresh),
        "access":  str(refresh.access_token),
    }


class RegisterView(APIView):
    """
    POST /api/auth/register/

    Public endpoint.  Accepts RELATIVE registrations only.
    Returns the new user data + JWT pair.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"message": "Registration failed.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = serializer.save()
        return Response(
            {
                "message": "Registered successfully.",
                "user":    UserProfileSerializer(user).data,
                "tokens":  _build_token_pair(user),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/

    Accepts { username, password }.  Returns JWT pair on success.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"message": "Invalid input.", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        username = serializer.validated_data["username"]
        password = serializer.validated_data["password"]

        try:
            user_obj = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {"message": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if user_obj.role == User.Role.CONTRIBUTOR:
            return Response(
                {"message": "Contributor accounts can no longer log in."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        user = authenticate(
            request=request,
            username=user_obj.username,
            password=password,
        )
        if user is None:
            return Response(
                {"message": "Invalid username or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        return Response(
            {
                "message": "Login successful.",
                "user":    UserProfileSerializer(user).data,
                "tokens":  _build_token_pair(user),
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/

    Blacklists the submitted refresh token (requires BLACKLIST app).
    Falls back gracefully if blacklisting is unavailable.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"message": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            # Token already invalid/expired — treat as logged-out.
            pass
        except Exception:
            # Blacklist app not installed — still respond OK.
            pass

        return Response({"message": "Logged out."}, status=status.HTTP_200_OK)


class MeView(APIView):
    """
    GET  /api/auth/me/    — return authenticated user's profile.
    PATCH /api/auth/me/   — update name / phone.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)