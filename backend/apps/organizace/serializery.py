from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ClenstviOrganizace, Organizace


class OrganizaceSerializer(serializers.ModelSerializer):
    ma_vlastni_smtp = serializers.SerializerMethodField(read_only=True)
    smtp_heslo = serializers.CharField(write_only=True, required=False, allow_blank=True)
    logo_soubor = serializers.FileField(required=False, allow_null=True)
    logo_soubor_url = serializers.SerializerMethodField(read_only=True)
    banner_soubor = serializers.FileField(required=False, allow_null=True)
    banner_soubor_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Organizace
        fields = [
            "id",
            "nazev",
            "slug",
            "slug_subdomeny",
            "vlastni_domena",
            "tenant_aktivni",
            "nazev_verejny",
            "verejny_popis",
            "logo_url",
            "logo_soubor",
            "logo_soubor_url",
            "banner_soubor",
            "banner_soubor_url",
            "banner_popis",
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
            "smtp_aktivni",
            "smtp_host",
            "smtp_port",
            "smtp_uzivatel",
            "smtp_heslo",
            "smtp_use_tls",
            "smtp_use_ssl",
            "smtp_od_email",
            "smtp_od_jmeno",
            "smtp_timeout",
            "ma_vlastni_smtp",
            "je_aktivni",
            "vytvoreno",
            "upraveno",
        ]
        read_only_fields = ["id", "vytvoreno", "upraveno"]

    def get_ma_vlastni_smtp(self, obj):
        return bool(obj.smtp_aktivni and obj.smtp_host)

    def get_logo_soubor_url(self, obj):
        request = self.context.get("request")
        if obj.logo_soubor:
            url = obj.logo_soubor.url
            return request.build_absolute_uri(url) if request else url
        return ""

    def get_banner_soubor_url(self, obj):
        request = self.context.get("request")
        if obj.banner_soubor:
            url = obj.banner_soubor.url
            return request.build_absolute_uri(url) if request else url
        return ""

    def validate(self, attrs):
        attrs = super().validate(attrs)
        smtp_aktivni = attrs.get("smtp_aktivni")
        smtp_host = (attrs.get("smtp_host") or "").strip()
        smtp_uzivatel = (attrs.get("smtp_uzivatel") or "").strip()
        smtp_heslo = (attrs.get("smtp_heslo") or "").strip()

        for pole in ["slug_subdomeny", "vlastni_domena", "nazev_verejny"]:
            if pole in attrs and isinstance(attrs[pole], str):
                hodnota = attrs[pole].strip()
                attrs[pole] = (hodnota or None) if pole == "slug_subdomeny" else hodnota

        if "smtp_host" in attrs:
            attrs["smtp_host"] = smtp_host
        if "smtp_uzivatel" in attrs:
            attrs["smtp_uzivatel"] = smtp_uzivatel
        if "smtp_heslo" in attrs and smtp_heslo == "":
            attrs.pop("smtp_heslo", None)

        if smtp_aktivni:
            chybejici = []
            if not smtp_host:
                chybejici.append("SMTP host")
            if not smtp_uzivatel:
                chybejici.append("SMTP uživatel")
            if not smtp_heslo and self.instance is None:
                chybejici.append("SMTP heslo")
            if chybejici:
                raise serializers.ValidationError(
                    "Pro aktivní SMTP doplň: " + ", ".join(chybejici).replace("SMTP ", "").lower() + "."
                )

        return attrs


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
