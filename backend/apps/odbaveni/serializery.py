from rest_framework import serializers

from .models import Odbaveni


class OdbaveniSerializer(serializers.ModelSerializer):
    vstupenka_kod = serializers.SerializerMethodField()
    akce_nazev = serializers.SerializerMethodField()

    class Meta:
        model = Odbaveni
        fields = [
            "id",
            "vstupenka",
            "vstupenka_kod",
            "akce",
            "akce_nazev",
            "vysledek",
            "naskenovany_kod",
            "naskenovano",
            "oznaceni_zarizeni",
        ]
        read_only_fields = fields

    def get_vstupenka_kod(self, obj):
        return obj.vstupenka.kod if obj.vstupenka else ""

    def get_akce_nazev(self, obj):
        return obj.akce.nazev if obj.akce else ""


class ScanVstupenkySerializer(serializers.Serializer):
    kod = serializers.CharField(max_length=255)
    oznaceni_zarizeni = serializers.CharField(max_length=120, allow_blank=True, required=False)
