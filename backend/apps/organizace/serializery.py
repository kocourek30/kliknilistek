from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ClenstviOrganizace, Organizace


class OrganizaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organizace
        fields = [
            "id",
            "nazev",
            "slug",
            "typ_organizace",
            "kontaktni_email",
            "kontaktni_telefon",
            "hlavni_barva",
            "fakturacni_nazev",
            "ico",
            "dic",
            "fakturacni_ulice",
            "fakturacni_mesto",
            "fakturacni_psc",
            "cislo_uctu",
            "kod_banky",
            "iban",
            "swift",
            "je_aktivni",
            "vytvoreno",
            "upraveno",
        ]
        read_only_fields = ["id", "vytvoreno", "upraveno"]


class ClenstviOrganizaceSerializer(serializers.ModelSerializer):
    organizace_nazev = serializers.CharField(source="organizace.nazev", read_only=True)
    uzivatel_jmeno = serializers.CharField(source="uzivatel.get_username", read_only=True)
    uzivatel_email = serializers.EmailField(source="uzivatel.email", read_only=True)
    nove_uzivatelske_jmeno = serializers.CharField(write_only=True, required=False, allow_blank=False)
    nove_uzivatelske_email = serializers.EmailField(write_only=True, required=False, allow_blank=False)
    nove_heslo = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = ClenstviOrganizace
        fields = [
            "id",
            "organizace",
            "organizace_nazev",
            "uzivatel",
            "uzivatel_jmeno",
            "uzivatel_email",
            "role",
            "je_aktivni",
            "nove_uzivatelske_jmeno",
            "nove_uzivatelske_email",
            "nove_heslo",
            "vytvoreno",
            "upraveno",
        ]
        read_only_fields = [
            "id",
            "vytvoreno",
            "upraveno",
            "organizace_nazev",
            "uzivatel_jmeno",
            "uzivatel_email",
        ]

    def validate(self, attrs):
        uzivatel = attrs.get("uzivatel")
        nove_uzivatelske_jmeno = attrs.get("nove_uzivatelske_jmeno")
        nove_uzivatelske_email = attrs.get("nove_uzivatelske_email")
        nove_heslo = attrs.get("nove_heslo")

        if self.instance is None and not uzivatel and not nove_uzivatelske_jmeno:
            raise serializers.ValidationError("Vyber existujiciho uzivatele nebo zadej nove uzivatelske jmeno.")

        if nove_uzivatelske_jmeno:
            if not nove_uzivatelske_email or not nove_heslo:
                raise serializers.ValidationError(
                    "Pro vytvoreni noveho uzivatele je potreba zadat e-mail a heslo."
                )

            uzivatel_model = get_user_model()
            if uzivatel_model.objects.filter(username=nove_uzivatelske_jmeno).exists():
                raise serializers.ValidationError("Uzivatel s timto jmenem uz existuje.")

        return attrs

    def create(self, validated_data):
        nove_uzivatelske_jmeno = validated_data.pop("nove_uzivatelske_jmeno", None)
        nove_uzivatelske_email = validated_data.pop("nove_uzivatelske_email", "")
        nove_heslo = validated_data.pop("nove_heslo", None)

        if nove_uzivatelske_jmeno:
            uzivatel_model = get_user_model()
            uzivatel = uzivatel_model.objects.create_user(
                username=nove_uzivatelske_jmeno,
                email=nove_uzivatelske_email,
                password=nove_heslo,
            )
            uzivatel.is_staff = True
            uzivatel.save(update_fields=["is_staff"])
            validated_data["uzivatel"] = uzivatel

        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("nove_uzivatelske_jmeno", None)
        validated_data.pop("nove_uzivatelske_email", None)
        validated_data.pop("nove_heslo", None)
        return super().update(instance, validated_data)
