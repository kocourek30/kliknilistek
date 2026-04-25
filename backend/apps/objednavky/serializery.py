from decimal import Decimal
from datetime import timedelta
from uuid import uuid4

from django.db import models, transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from apps.akce.models import KategorieVstupenky
from apps.akce.schema_sezeni import iteruj_mista_schema, ziskej_schema_sezeni_pro_akci
from apps.fakturace.sluzby import (
    odeslat_proformu_objednavky,
    vytvor_nebo_aktualizuj_proformu,
    vytvor_qr_svg,
)
from apps.vstupenky.models import Vstupenka

from .models import Objednavka, PolozkaObjednavky


class PolozkaObjednavkySerializer(serializers.ModelSerializer):
    kategorie_vstupenky_nazev = serializers.CharField(
        source="kategorie_vstupenky.nazev",
        read_only=True,
    )
    akce_nazev = serializers.CharField(source="akce.nazev", read_only=True)

    class Meta:
        model = PolozkaObjednavky
        fields = [
            "id",
            "akce",
            "akce_nazev",
            "kategorie_vstupenky",
            "kategorie_vstupenky_nazev",
            "pocet",
            "vybrana_mista",
            "cena_za_kus",
            "cena_celkem",
        ]
        read_only_fields = fields


class ObjednavkaSerializer(serializers.ModelSerializer):
    polozky = PolozkaObjednavkySerializer(many=True, read_only=True)
    vstupenky = serializers.SerializerMethodField()
    platby = serializers.SerializerMethodField()
    emailove_zasilky = serializers.SerializerMethodField()
    proforma_doklad = serializers.SerializerMethodField()

    class Meta:
        model = Objednavka
        fields = [
            "id",
            "verejne_id",
            "organizace",
            "email_zakaznika",
            "jmeno_zakaznika",
            "telefon_zakaznika",
            "stav",
            "zpusob_uhrady",
            "mezisoucet",
            "poplatek",
            "celkem",
            "mena",
            "rezervace_do",
            "je_rezervace_aktivni",
            "vytvoreno",
            "polozky",
            "vstupenky",
            "platby",
            "emailove_zasilky",
            "proforma_doklad",
        ]
        read_only_fields = fields

    def get_vstupenky(self, obj):
        return [
            {
                "id": vstupenka.id,
                "kod": vstupenka.kod,
                "stav": vstupenka.stav,
                "akce_nazev": vstupenka.akce.nazev,
                "kategorie_vstupenky_nazev": vstupenka.kategorie_vstupenky.nazev,
                "oznaceni_mista": vstupenka.oznaceni_mista,
                "dorucena": vstupenka.dorucena,
            }
            for vstupenka in obj.vstupenky.select_related("akce", "kategorie_vstupenky").all()
        ]

    def get_platby(self, obj):
        return [
            {
                "id": platba.id,
                "poskytovatel": platba.poskytovatel,
                "stav": platba.stav,
                "castka": platba.castka,
                "mena": platba.mena,
                "vytvoreno": platba.vytvoreno,
            }
            for platba in obj.platby.all()
        ]

    def get_emailove_zasilky(self, obj):
        return [
            {
                "id": zasilka.id,
                "prijemce_email": zasilka.prijemce_email,
                "predmet": zasilka.predmet,
                "stav": zasilka.stav,
                "pocet_priloh": zasilka.pocet_priloh,
                "odeslano_v": zasilka.odeslano_v,
                "vytvoreno": zasilka.vytvoreno,
            }
            for zasilka in obj.emailove_zasilky.all()
        ]

    def get_proforma_doklad(self, obj):
        proforma = getattr(obj, "proforma_doklad", None)
        if not proforma:
            return None
        return {
            "cislo_dokladu": proforma.cislo_dokladu,
            "stav": proforma.stav,
            "datum_vystaveni": proforma.datum_vystaveni,
            "datum_splatnosti": proforma.datum_splatnosti,
            "castka": proforma.castka,
            "mena": proforma.mena,
            "variabilni_symbol": proforma.variabilni_symbol,
            "specificky_symbol": proforma.specificky_symbol,
            "zprava_pro_prijemce": proforma.zprava_pro_prijemce,
            "qr_platba_data": proforma.qr_platba_data,
            "qr_platba_svg": vytvor_qr_svg(proforma.qr_platba_data) if proforma.qr_platba_data else "",
            "cislo_uctu": f"{obj.organizace.cislo_uctu}/{obj.organizace.kod_banky}".strip("/"),
            "iban": obj.organizace.iban,
        }


class VytvoreniPolozkySerializer(serializers.Serializer):
    kategorie_vstupenky = serializers.IntegerField(min_value=1)
    pocet = serializers.IntegerField(min_value=1)
    vybrana_mista = serializers.ListField(
        child=serializers.CharField(max_length=64),
        required=False,
        allow_empty=True,
    )


class VytvoreniObjednavkySerializer(serializers.Serializer):
    email_zakaznika = serializers.EmailField()
    jmeno_zakaznika = serializers.CharField(max_length=255, allow_blank=True, required=False)
    telefon_zakaznika = serializers.CharField(max_length=32, allow_blank=True, required=False)
    zpusob_uhrady = serializers.ChoiceField(
        choices=Objednavka.ZpusobUhrady.choices,
        default=Objednavka.ZpusobUhrady.ONLINE,
    )
    polozky = VytvoreniPolozkySerializer(many=True, min_length=1)

    def ziskej_platna_mista(self, schema):
        return {misto["kod"]: misto for misto in iteruj_mista_schema(schema)}

    def validate(self, attrs):
        zpusob_uhrady = attrs.get("zpusob_uhrady", Objednavka.ZpusobUhrady.ONLINE)
        polozky = attrs.get("polozky", [])
        if not polozky:
            return attrs

        ids_kategorii = [polozka["kategorie_vstupenky"] for polozka in polozky]
        prvni_kategorie = (
            KategorieVstupenky.objects.select_related("organizace")
            .filter(id__in=ids_kategorii, je_aktivni=True)
            .first()
        )
        if (
            zpusob_uhrady == Objednavka.ZpusobUhrady.BANKOVNI_PREVOD
            and prvni_kategorie
            and (not prvni_kategorie.organizace.cislo_uctu or not prvni_kategorie.organizace.kod_banky)
        ):
            raise serializers.ValidationError(
                "Organizace nemá vyplněné bankovní údaje pro vystavení proforma dokladu."
            )
        return attrs

    def validate_polozky(self, value):
        ids_kategorii = [polozka["kategorie_vstupenky"] for polozka in value]
        kategorie = {
            polozka.id: polozka
            for polozka in KategorieVstupenky.objects.select_related("akce", "organizace").filter(
                id__in=ids_kategorii,
                je_aktivni=True,
            )
        }

        if len(kategorie) != len(set(ids_kategorii)):
            raise serializers.ValidationError("Jedna nebo vice kategorii vstupenek neexistuje nebo nejsou aktivni.")

        organizace_id = None
        mena = None
        for polozka in value:
            kategorie_vstupenky = kategorie[polozka["kategorie_vstupenky"]]
            if organizace_id is None:
                organizace_id = kategorie_vstupenky.organizace_id
                mena = kategorie_vstupenky.mena
            if kategorie_vstupenky.organizace_id != organizace_id:
                raise serializers.ValidationError("Vsechny polozky objednavky musi patrit do jedne organizace.")
            if kategorie_vstupenky.mena != mena:
                raise serializers.ValidationError("Vsechny polozky objednavky musi byt ve stejne mene.")

            schema_sezeni = ziskej_schema_sezeni_pro_akci(kategorie_vstupenky.akce)
            vybrana_mista = polozka.get("vybrana_mista", [])
            if schema_sezeni:
                if len(vybrana_mista) != polozka["pocet"]:
                    raise serializers.ValidationError(
                        "U mistenkove akce musi pocet vybranych mist odpovidat poctu vstupenek."
                    )
                if len(set(vybrana_mista)) != len(vybrana_mista):
                    raise serializers.ValidationError("Stejne misto nelze v jedne polozce vybrat vicekrat.")

                platna_mista = self.ziskej_platna_mista(schema_sezeni)
                neplatna_mista = [misto for misto in vybrana_mista if misto not in platna_mista]
                if neplatna_mista:
                    raise serializers.ValidationError(
                        f"Vybrana mista neexistuji v planu salu: {', '.join(neplatna_mista)}."
                    )

                manualni_stavy = getattr(kategorie_vstupenky.akce, "manualni_stavy_mist", None) or {}
                blokovana_manualne = [
                    misto
                    for misto in vybrana_mista
                    if (manualni_stavy.get(misto) or {}).get("stav") == "blokovano"
                ]
                if blokovana_manualne:
                    raise serializers.ValidationError(
                        f"Rucne blokovana mista: {', '.join(sorted(blokovana_manualne))}."
                    )

                povolene_zony = kategorie_vstupenky.povolene_zony or []
                if povolene_zony:
                    nepovolena = [
                        misto for misto in vybrana_mista if platna_mista[misto].get("zona") not in povolene_zony
                    ]
                    if nepovolena:
                        raise serializers.ValidationError(
                            f"Vybrana mista nespadaji do povolenych zon kategorie '{kategorie_vstupenky.nazev}'."
                        )

                blokovana_mista = set(
                    Vstupenka.objects.filter(
                        akce=kategorie_vstupenky.akce,
                        oznaceni_mista__in=vybrana_mista,
                    )
                    .exclude(stav__in=[Vstupenka.Stav.ZRUSENA, Vstupenka.Stav.VRACENA])
                    .filter(
                        models.Q(objednavka__stav=Objednavka.Stav.ZAPLACENO)
                        | models.Q(
                            objednavka__stav__in=[Objednavka.Stav.NAVRH, Objednavka.Stav.CEKA_NA_PLATBU],
                            objednavka__rezervace_do__gt=timezone.now(),
                        )
                    )
                    .values_list("oznaceni_mista", flat=True)
                )
                if blokovana_mista:
                    raise serializers.ValidationError(
                        f"Uz obsazena nebo rezervovana mista: {', '.join(sorted(blokovana_mista))}."
                    )
            elif vybrana_mista:
                raise serializers.ValidationError("Pro tuto akci neni mistenkovy vyber aktivni.")

            rezervovano = (
                PolozkaObjednavky.objects.filter(
                    kategorie_vstupenky=kategorie_vstupenky,
                    objednavka__stav=Objednavka.Stav.ZAPLACENO,
                ).aggregate(soucet=Sum("pocet"))["soucet"]
                or 0
            )

            rezervovano += (
                PolozkaObjednavky.objects.filter(
                    kategorie_vstupenky=kategorie_vstupenky,
                    objednavka__stav__in=[
                        Objednavka.Stav.NAVRH,
                        Objednavka.Stav.CEKA_NA_PLATBU,
                    ],
                    objednavka__rezervace_do__gt=timezone.now(),
                ).aggregate(soucet=Sum("pocet"))["soucet"]
                or 0
            )

            dostupne = max(kategorie_vstupenky.kapacita - rezervovano, 0)
            if polozka["pocet"] > dostupne:
                raise serializers.ValidationError(
                    f"Pro kategorii '{kategorie_vstupenky.nazev}' zbyva pouze {dostupne} vstupenek."
                )

        self.context["kategorie_map"] = kategorie
        self.context["organizace_id"] = organizace_id
        self.context["mena"] = mena

        request = self.context.get("request")
        tenant_organizace = getattr(request, "tenant_organizace", None) if request else None
        if tenant_organizace is not None and tenant_organizace.id != organizace_id:
            raise serializers.ValidationError(
                "Na této subdoméně lze objednávat jen akce dané organizace."
            )
        return value

    @transaction.atomic
    def create(self, validated_data):
        kategorie_map = self.context["kategorie_map"]
        organizace_id = self.context["organizace_id"]
        mena = self.context["mena"]

        objednavka = Objednavka.objects.create(
            organizace_id=organizace_id,
            verejne_id=uuid4().hex[:12].upper(),
            email_zakaznika=validated_data["email_zakaznika"],
            jmeno_zakaznika=validated_data.get("jmeno_zakaznika", ""),
            telefon_zakaznika=validated_data.get("telefon_zakaznika", ""),
            vytvoril=getattr(getattr(self, "context", {}).get("request"), "user", None)
            if getattr(getattr(self, "context", {}).get("request"), "user", None)
            and getattr(self.context["request"].user, "is_authenticated", False)
            else None,
            zpusob_uhrady=validated_data.get("zpusob_uhrady", Objednavka.ZpusobUhrady.ONLINE),
            stav=Objednavka.Stav.CEKA_NA_PLATBU,
            mena=mena,
            rezervace_do=timezone.now()
            + timedelta(
                minutes=max(
                    1,
                    kategorie_map[validated_data["polozky"][0]["kategorie_vstupenky"]]
                    .akce.rezervace_platnost_minuty,
                )
            ),
        )

        mezisoucet = Decimal("0.00")
        for polozka in validated_data["polozky"]:
            kategorie_vstupenky = kategorie_map[polozka["kategorie_vstupenky"]]
            cena_za_kus = kategorie_vstupenky.cena
            cena_celkem = cena_za_kus * polozka["pocet"]
            mezisoucet += cena_celkem

            polozka_objednavky = PolozkaObjednavky.objects.create(
                organizace_id=organizace_id,
                objednavka=objednavka,
                kategorie_vstupenky=kategorie_vstupenky,
                akce=kategorie_vstupenky.akce,
                pocet=polozka["pocet"],
                vybrana_mista=polozka.get("vybrana_mista", []),
                cena_za_kus=cena_za_kus,
                cena_celkem=cena_celkem,
            )

            vybrana_mista = polozka.get("vybrana_mista", [])
            for index in range(polozka["pocet"]):
                kod = uuid4().hex.upper()
                Vstupenka.objects.create(
                    organizace_id=organizace_id,
                    objednavka=objednavka,
                    polozka_objednavky=polozka_objednavky,
                    akce=kategorie_vstupenky.akce,
                    kategorie_vstupenky=kategorie_vstupenky,
                    oznaceni_mista=vybrana_mista[index] if index < len(vybrana_mista) else "",
                    kod=kod,
                    qr_data=f"KLIKNILISTEK:{kod}",
                    jmeno_navstevnika=validated_data.get("jmeno_zakaznika", ""),
                    email_navstevnika=validated_data["email_zakaznika"],
                    stav=Vstupenka.Stav.REZERVOVANA,
                )

        objednavka.mezisoucet = mezisoucet
        objednavka.poplatek = Decimal("0.00")
        objednavka.celkem = mezisoucet
        objednavka.save(update_fields=["mezisoucet", "poplatek", "celkem", "upraveno"])
        if objednavka.zpusob_uhrady == Objednavka.ZpusobUhrady.BANKOVNI_PREVOD:
            proforma = vytvor_nebo_aktualizuj_proformu(objednavka)
            try:
                odeslat_proformu_objednavky(proforma)
            except Exception:
                pass
        return objednavka


class PotvrzeniHotovostiSerializer(serializers.Serializer):
    odeslat_na_email = serializers.BooleanField(default=False)


class StornoObjednavkySerializer(serializers.Serializer):
    duvod = serializers.CharField(max_length=255, allow_blank=True, required=False)


class PokladniProdejSerializer(VytvoreniObjednavkySerializer):
    odeslat_na_email = serializers.BooleanField(default=False)


class VraceniObjednavkySerializer(serializers.Serializer):
    duvod = serializers.CharField(max_length=255, allow_blank=True, required=False)
