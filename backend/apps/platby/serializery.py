from rest_framework import serializers

from .models import Platba


class PlatbaSerializer(serializers.ModelSerializer):
    objednavka_verejne_id = serializers.CharField(source="objednavka.verejne_id", read_only=True)

    class Meta:
        model = Platba
        fields = [
            "id",
            "objednavka",
            "objednavka_verejne_id",
            "poskytovatel",
            "reference_poskytovatele",
            "stav",
            "castka",
            "mena",
            "data_poskytovatele",
            "vytvoreno",
        ]
        read_only_fields = fields


class SimulacePlatbySerializer(serializers.Serializer):
    poskytovatel = serializers.ChoiceField(
        choices=Platba.Poskytovatel.choices,
        default=Platba.Poskytovatel.STRIPE,
    )
