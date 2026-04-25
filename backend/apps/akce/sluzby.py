from copy import deepcopy

from django.db import transaction

from apps.vstupenky.models import Vstupenka

from .models import Akce
from .schema_sezeni import ziskej_schema_sezeni_pro_misto


def je_misto_obsazene_nebo_rezervovane(akce: Akce, kod: str) -> bool:
    return Vstupenka.objects.filter(
        akce=akce,
        oznaceni_mista=kod,
    ).exclude(stav__in=[Vstupenka.Stav.ZRUSENA, Vstupenka.Stav.VRACENA]).exists()


@transaction.atomic
def blokovat_misto_na_akci(akce: Akce, kod: str, duvod: str = "") -> Akce:
    if je_misto_obsazene_nebo_rezervovane(akce, kod):
        raise ValueError("Misto je uz rezervovane nebo prodane a nelze ho rucne blokovat.")
    stavy = dict(akce.manualni_stavy_mist or {})
    stavy[kod] = {"stav": "blokovano", "duvod": duvod}
    akce.manualni_stavy_mist = stavy
    akce.save(update_fields=["manualni_stavy_mist", "upraveno"])
    return akce


@transaction.atomic
def odblokovat_misto_na_akci(akce: Akce, kod: str) -> Akce:
    stavy = dict(akce.manualni_stavy_mist or {})
    if kod in stavy:
        stavy.pop(kod)
        akce.manualni_stavy_mist = stavy
        akce.save(update_fields=["manualni_stavy_mist", "upraveno"])
    return akce


@transaction.atomic
def prevzit_schema_mista_do_akce(akce: Akce) -> Akce:
    schema = deepcopy(ziskej_schema_sezeni_pro_misto(akce.misto_konani))
    akce.schema_sezeni_override = schema
    akce.save(update_fields=["schema_sezeni_override", "upraveno"])
    return akce


@transaction.atomic
def zrusit_schema_override_akce(akce: Akce) -> Akce:
    akce.schema_sezeni_override = {}
    akce.save(update_fields=["schema_sezeni_override", "upraveno"])
    return akce
