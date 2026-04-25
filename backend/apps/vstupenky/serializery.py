from rest_framework import serializers

from .models import Vstupenka


class VstupenkaSerializer(serializers.ModelSerializer):
    akce_nazev = serializers.CharField(source="akce.nazev", read_only=True)
    kategorie_vstupenky_nazev = serializers.CharField(
        source="kategorie_vstupenky.nazev",
        read_only=True,
    )
    objednavka_verejne_id = serializers.CharField(source="objednavka.verejne_id", read_only=True)

    class Meta:
        model = Vstupenka
        fields = [
            "id",
            "objednavka",
            "objednavka_verejne_id",
            "akce",
            "akce_nazev",
            "kategorie_vstupenky",
            "kategorie_vstupenky_nazev",
            "oznaceni_mista",
            "kod",
            "qr_data",
            "jmeno_navstevnika",
            "email_navstevnika",
            "stav",
            "vystavena",
            "dorucena",
        ]
        read_only_fields = fields
