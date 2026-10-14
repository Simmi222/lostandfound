from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for new user registration."""

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "password",
            "confirm_password",
            "role",
            "phone_number",
            "first_name",
            "last_name",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            # ADMIN role must never be assigned via public registration.
            "role": {"required": True},
        }

    def validate_role(self, value):
        allowed = {User.Role.RELATIVE}
        if value not in allowed:
            raise serializers.ValidationError(
                "Invalid role. Choose RELATIVE."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("confirm_password"):
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for username-based login."""

    username = serializers.CharField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)


class UserProfileSerializer(serializers.ModelSerializer):
    """Read (and partially update) the authenticated user's own profile."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "role",
            "phone_number",
            "first_name",
            "last_name",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "role", "date_joined"]