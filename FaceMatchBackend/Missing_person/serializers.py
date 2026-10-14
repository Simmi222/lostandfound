
# pyrefly: ignore [missing-import]
from rest_framework import serializers
from Missing_person.models import MissingPerson, RelativeDetail


class MissingPersonSerializer(serializers.ModelSerializer):

    class Meta:
        model = MissingPerson
        fields = '__all__'


class RelativeSerializer(serializers.ModelSerializer):
    """Serializer for RelativeDetail — links a user to a missing person report."""

    # Read-only display fields from related models
    missing_person_name = serializers.CharField(
        source='missingperson.name',
        read_only=True,
    )
    user_email = serializers.CharField(
        source='user.email',
        read_only=True,
    )

    class Meta:
        model = RelativeDetail
        fields = [
            'id',
            'missingperson',
            'missing_person_name',
            'user',
            'user_email',
            'relative_name',
            'relation',
            'mobile_number',
            'address',
            'id_proof',
        ]
        read_only_fields = ['id', 'missing_person_name', 'user_email']