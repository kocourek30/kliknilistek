from rest_framework import serializers
from django.db import models
from django.utils import timezone

from .models import Akce, FotkaAkce, KategorieVstupenky, MistoKonani
from .schema_sezeni import (
    iteruj_mista_schema,
    ziskej_schema_sezeni_pro_akci,
    ziskej_schema_sezeni_pro_misto,
)
from apps.vstupenky.models import Vstupenka


def ziskej_stavy_mist_pro_akci(akce):
    schema = ziskej_schema_sezeni_pro_akci(akce)
    if not schema:
        return []

    mista = {
        misto["kod"]: {
            **misto,
            "stav": "volne",
            "objednavka_verejne_id": "",
            "vstupenka_kod": "",
            "vstupenka_stav": "",
            "kategorie_vstupenky_nazev": "",
            "rezervace_do": None,
        }
        for misto in iteruj_mista_schema(schema)
    }
    if not mista:
        return []

    priority = {
        "volne": 0,
        "blokovano": 1,
        "rezervace": 1,
        "platne": 2,
        "odbavene": 3,
    }
    ted = timezone.now()

    for vstupenka in (
        Vstupenka.objects.filter(akce=akce)
        .select_related("objednavka", "kategorie_vstupenky")
        .exclude(oznaceni_mista="")
        .order_by("-vystavena")
    ):
        detail = mista.get(vstupenka.oznaceni_mista)
        if not detail:
            continue

        stav = None
        if vstupenka.stav == Vstupenka.Stav.ODBAVENA:
            stav = "odbavene"
        elif vstupenka.stav == Vstupenka.Stav.PLATNA:
            stav = "platne"
        elif (
            vstupenka.stav == Vstupenka.Stav.REZERVOVANA
            and vstupenka.objednavka.stav in [vstupenka.objednavka.Stav.NAVRH, vstupenka.objednavka.Stav.CEKA_NA_PLATBU]
            and (vstupenka.objednavka.rezervace_do is None or vstupenka.objednavka.rezervace_do > ted)
        ):
            stav = "rezervace"

        if not stav or priority[stav] < priority[detail["stav"]]:
            continue

        detail.update(
            {
                "stav": stav,
                "objednavka_verejne_id": vstupenka.objednavka.verejne_id,
                "vstupenka_kod": vstupenka.kod,
                "vstupenka_stav": vstupenka.stav,
                "kategorie_vstupenky_nazev": vstupenka.kategorie_vstupenky.nazev,
                "rezervace_do": vstupenka.objednavka.rezervace_do,
            }
        )

    manualni_stavy = getattr(akce, "manualni_stavy_mist", None) or {}
    for kod, data in manualni_stavy.items():
        detail = mista.get(kod)
        if not detail:
            continue
        if data.get("stav") == "blokovano" and detail["stav"] == "volne":
            detail.update(
                {
                    "stav": "blokovano",
                    "duvod_blokace": data.get("duvod", ""),
                }
            )

    return list(mista.values())


class MistoKonaniSerializer(serializers.ModelSerializer):
    organizace_nazev = serializers.CharField(source="organizace.nazev", read_only=True)
    schema_sezeni = serializers.JSONField(required=False)
    hlavni_fotka_url = serializers.SerializerMethodField()
    hlavni_fotka = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = MistoKonani
        fields = [
            "id",
            "organizace",
            "organizace_nazev",
            "nazev",
            "adresa",
            "mesto",
            "kapacita",
            "hlavni_fotka",
            "hlavni_fotka_url",
            "schema_sezeni",
            "vytvoreno",
            "upraveno",
        ]
        read_only_fields = ["id", "vytvoreno", "upraveno", "organizace_nazev"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["schema_sezeni"] = ziskej_schema_sezeni_pro_misto(instance)
        return data

    def get_hlavni_fotka_url(self, obj):
        request = self.context.get("request")
        if obj.hlavni_fotka:
            url = obj.hlavni_fotka.url
            return request.build_absolute_uri(url) if request else url
        return ""


class FotkaAkceSerializer(serializers.ModelSerializer):
    soubor_url = serializers.SerializerMethodField()

    class Meta:
        model = FotkaAkce
        fields = [
            "id",
            "soubor",
            "soubor_url",
            "popis",
            "poradi",
            "je_doporucena",
            "vytvoreno",
            "upraveno",
        ]
        read_only_fields = ["id", "vytvoreno", "upraveno", "soubor_url"]

    def get_soubor_url(self, obj):
        request = self.context.get("request")
        if obj.soubor:
            url = obj.soubor.url
            return request.build_absolute_uri(url) if request else url
        return ""


class AkceSerializer(serializers.ModelSerializer):
    organizace_nazev = serializers.CharField(source="organizace.nazev", read_only=True)
    misto_konani_nazev = serializers.CharField(source="misto_konani.nazev", read_only=True)
    misto_konani_hlavni_fotka_url = serializers.SerializerMethodField()
    schema_sezeni = serializers.SerializerMethodField()
    schema_sezeni_override = serializers.JSONField(required=False)
    ma_vlastni_schema_sezeni = serializers.SerializerMethodField()
    manualni_stavy_mist = serializers.JSONField(required=False)
    obsazena_mista = serializers.SerializerMethodField()
    stavy_mist = serializers.SerializerMethodField()
    souhrn_mist = serializers.SerializerMethodField()
    dostupne_zony = serializers.SerializerMethodField()
    hlavni_fotka = serializers.FileField(required=False, allow_null=True)
    hlavni_fotka_soubor_url = serializers.SerializerMethodField()
    fotky_galerie = FotkaAkceSerializer(many=True, read_only=True)

    class Meta:
        model = Akce
        fields = [
            "id",
            "organizace",
            "organizace_nazev",
            "nazev",
            "slug",
            "typ_akce",
            "perex",
            "popis",
            "hlavni_fotka_url",
            "hlavni_fotka",
            "hlavni_fotka_soubor_url",
            "hlavni_fotka_pomer",
            "fotky_galerie",
            "galerie_fotka_pomer",
            "video_url",
            "misto_konani",
            "misto_konani_nazev",
            "misto_konani_hlavni_fotka_url",
            "schema_sezeni",
            "schema_sezeni_override",
            "ma_vlastni_schema_sezeni",
            "manualni_stavy_mist",
            "dostupne_zony",
            "obsazena_mista",
            "stavy_mist",
            "souhrn_mist",
            "zacatek",
            "konec",
            "stav",
            "kapacita",
            "rezervace_platnost_minuty",
            "je_doporucena",
            "vytvoreno",
            "upraveno",
        ]
        read_only_fields = [
            "id",
            "vytvoreno",
            "upraveno",
            "organizace_nazev",
            "misto_konani_nazev",
            "schema_sezeni",
            "ma_vlastni_schema_sezeni",
            "dostupne_zony",
            "obsazena_mista",
            "stavy_mist",
            "souhrn_mist",
        ]

    def get_schema_sezeni(self, obj):
        return ziskej_schema_sezeni_pro_akci(obj)

    def get_hlavni_fotka_soubor_url(self, obj):
        request = self.context.get("request")
        if obj.hlavni_fotka:
            url = obj.hlavni_fotka.url
            return request.build_absolute_uri(url) if request else url
        return ""

    def get_misto_konani_hlavni_fotka_url(self, obj):
        request = self.context.get("request")
        if obj.misto_konani and obj.misto_konani.hlavni_fotka:
            url = obj.misto_konani.hlavni_fotka.url
            return request.build_absolute_uri(url) if request else url
        return ""

    def get_ma_vlastni_schema_sezeni(self, obj):
        return bool(obj.schema_sezeni_override)

    def get_dostupne_zony(self, obj):
        schema = ziskej_schema_sezeni_pro_akci(obj)
        zony = []
        for misto in iteruj_mista_schema(schema):
            zona = misto.get("zona")
            if zona and zona not in zony:
                zony.append(zona)
        return zony

    def get_obsazena_mista(self, obj):
        return [
            misto["kod"]
            for misto in ziskej_stavy_mist_pro_akci(obj)
            if misto["stav"] in ["blokovano", "rezervace", "platne", "odbavene"]
        ]

    def get_stavy_mist(self, obj):
        return ziskej_stavy_mist_pro_akci(obj)

    def get_souhrn_mist(self, obj):
        stavy = ziskej_stavy_mist_pro_akci(obj)
        souhrn = {"volne": 0, "blokovano": 0, "rezervace": 0, "platne": 0, "odbavene": 0}
        for misto in stavy:
            souhrn[misto["stav"]] = souhrn.get(misto["stav"], 0) + 1
        return souhrn


class KategorieVstupenkySerializer(serializers.ModelSerializer):
    organizace_nazev = serializers.CharField(source="organizace.nazev", read_only=True)
    akce_nazev = serializers.CharField(source="akce.nazev", read_only=True)

    class Meta:
        model = KategorieVstupenky
        fields = [
            "id",
            "organizace",
            "organizace_nazev",
            "akce",
            "akce_nazev",
            "nazev",
            "popis",
            "cena",
            "mena",
            "kapacita",
            "povolene_zony",
            "prodej_od",
            "prodej_do",
            "je_aktivni",
            "vytvoreno",
            "upraveno",
        ]
        read_only_fields = ["id", "vytvoreno", "upraveno", "organizace_nazev", "akce_nazev"]
