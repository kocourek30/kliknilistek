from rest_framework import serializers

from .models import ProformaDoklad
from .sluzby import vytvor_qr_svg


class ProformaDokladSerializer(serializers.ModelSerializer):
    objednavka_verejne_id = serializers.CharField(source="objednavka.verejne_id", read_only=True)
    organizace_nazev = serializers.CharField(source="organizace.nazev", read_only=True)
    qr_platba_svg = serializers.SerializerMethodField()
    cislo_uctu = serializers.SerializerMethodField()
    iban = serializers.SerializerMethodField()

    class Meta:
        model = ProformaDoklad
        fields = [
            "id",
            "objednavka",
            "objednavka_verejne_id",
            "organizace",
            "organizace_nazev",
            "cislo_dokladu",
            "variabilni_symbol",
            "specificky_symbol",
            "datum_vystaveni",
            "datum_splatnosti",
            "castka",
            "mena",
            "stav",
            "qr_platba_data",
            "qr_platba_svg",
            "zprava_pro_prijemce",
            "poznamka",
            "uhrazeno_v",
            "cislo_uctu",
            "iban",
            "vytvoreno",
        ]
        read_only_fields = fields

    def get_qr_platba_svg(self, obj):
        if not obj.qr_platba_data:
            return ""
        return vytvor_qr_svg(obj.qr_platba_data)

    def get_cislo_uctu(self, obj):
        ucet = obj.organizace.cislo_uctu or ""
        banka = obj.organizace.kod_banky or ""
        return f"{ucet}/{banka}".strip("/")

    def get_iban(self, obj):
        return obj.organizace.iban

