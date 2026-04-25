from rest_framework import serializers

from .models import NastaveniSystemu


class NastaveniSystemuSerializer(serializers.ModelSerializer):
    ma_globalni_smtp = serializers.SerializerMethodField(read_only=True)
    smtp_heslo = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = NastaveniSystemu
        fields = [
            "id",
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
            "ma_globalni_smtp",
            "vytvoreno",
            "upraveno",
        ]
        read_only_fields = ["id", "ma_globalni_smtp", "vytvoreno", "upraveno"]

    def get_ma_globalni_smtp(self, obj):
        return bool(obj.smtp_aktivni and obj.smtp_host)
