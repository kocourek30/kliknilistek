from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

from apps.akce.schema_sezeni import iteruj_mista_schema, ziskej_schema_sezeni_pro_akci
from apps.platby.models import Platba
from apps.vstupenky.models import Vstupenka
from apps.vstupenky.sluzby import odeslat_vstupenky_objednavky

from .models import Objednavka


@transaction.atomic
def zneplatni_propadlou_objednavku(objednavka: Objednavka) -> Objednavka:
    if objednavka.stav != Objednavka.Stav.CEKA_NA_PLATBU:
        return objednavka
    if objednavka.rezervace_do is None or objednavka.rezervace_do > timezone.now():
        return objednavka

    objednavka.stav = Objednavka.Stav.ZRUSENO
    objednavka.save(update_fields=["stav", "upraveno"])
    objednavka.vstupenky.filter(stav=Vstupenka.Stav.REZERVOVANA).update(
        stav=Vstupenka.Stav.ZRUSENA,
        upraveno=timezone.now(),
    )
    return objednavka


@transaction.atomic
def potvrdit_uhradu_objednavky(
    objednavka: Objednavka,
    *,
    poskytovatel: str,
    reference_poskytovatele: str,
    uzivatel=None,
    odeslat_na_email: bool = False,
    data_poskytovatele: dict | None = None,
) -> Objednavka:
    objednavka = zneplatni_propadlou_objednavku(objednavka)
    if objednavka.stav == Objednavka.Stav.ZRUSENO:
        raise ValueError("Rezervace uz vyprsela a objednavku nelze potvrdit jako zaplacenou.")
    if objednavka.stav == Objednavka.Stav.VRACENO:
        raise ValueError("Vracenou objednavku nelze znovu potvrdit.")

    if objednavka.stav != Objednavka.Stav.ZAPLACENO:
        Platba.objects.create(
            organizace=objednavka.organizace,
            objednavka=objednavka,
            poskytovatel=poskytovatel,
            reference_poskytovatele=reference_poskytovatele,
            stav=Platba.Stav.USPESNA,
            castka=objednavka.celkem,
            mena=objednavka.mena,
            data_poskytovatele=data_poskytovatele
            or {
                "provedl": getattr(uzivatel, "username", ""),
                "provedeno_v": timezone.now().isoformat(),
            },
        )
        objednavka.stav = Objednavka.Stav.ZAPLACENO
        objednavka.save(update_fields=["stav", "upraveno"])
        objednavka.vstupenky.filter(stav=Vstupenka.Stav.REZERVOVANA).update(
            stav=Vstupenka.Stav.PLATNA,
            upraveno=timezone.now(),
            posledni_zmenu_stavu_provedl=uzivatel,
        )

    if odeslat_na_email:
        odeslat_vstupenky_objednavky(objednavka)

    return objednavka


@transaction.atomic
def potvrdit_hotovost_objednavky(
    objednavka: Objednavka,
    *,
    uzivatel=None,
    odeslat_na_email: bool = False,
) -> Objednavka:
    return potvrdit_uhradu_objednavky(
        objednavka,
        poskytovatel=Platba.Poskytovatel.HOTOVOST,
        reference_poskytovatele=f"HOT-{objednavka.verejne_id}",
        uzivatel=uzivatel,
        odeslat_na_email=odeslat_na_email,
        data_poskytovatele={
            "typ": "pokladna",
            "provedl": getattr(uzivatel, "username", ""),
            "provedeno_v": timezone.now().isoformat(),
        },
    )


@transaction.atomic
def stornovat_objednavku(objednavka: Objednavka, *, uzivatel=None, duvod: str = "") -> Objednavka:
    if objednavka.stav in {Objednavka.Stav.ZRUSENO, Objednavka.Stav.VRACENO}:
        return objednavka

    if objednavka.vstupenky.filter(stav=Vstupenka.Stav.ODBAVENA).exists():
        raise ValueError("Objednavku s odbavenou vstupenkou nelze stornovat.")

    objednavka.stav = Objednavka.Stav.ZRUSENO
    objednavka.save(update_fields=["stav", "upraveno"])
    try:
        proforma = objednavka.proforma_doklad
    except ObjectDoesNotExist:
        proforma = None
    if proforma is not None and proforma.stav != "zaplaceno":
        proforma.stav = "storno"
        proforma.save(update_fields=["stav", "upraveno"])
    objednavka.vstupenky.exclude(stav=Vstupenka.Stav.ZRUSENA).update(
        stav=Vstupenka.Stav.ZRUSENA,
        upraveno=timezone.now(),
        posledni_zmenu_stavu_provedl=uzivatel,
    )
    return objednavka


@transaction.atomic
def vratit_objednavku(objednavka: Objednavka, *, uzivatel=None, duvod: str = "") -> Objednavka:
    if objednavka.stav == Objednavka.Stav.VRACENO:
        return objednavka

    if objednavka.stav != Objednavka.Stav.ZAPLACENO:
        raise ValueError("Vratit lze jen zaplacenou objednavku.")

    if objednavka.vstupenky.filter(stav=Vstupenka.Stav.ODBAVENA).exists():
        raise ValueError("Objednavku s odbavenou vstupenkou nelze vratit.")

    objednavka.stav = Objednavka.Stav.VRACENO
    objednavka.save(update_fields=["stav", "upraveno"])

    objednavka.platby.exclude(stav=Platba.Stav.VRACENA).update(
        stav=Platba.Stav.VRACENA,
        upraveno=timezone.now(),
    )
    objednavka.vstupenky.exclude(stav=Vstupenka.Stav.VRACENA).update(
        stav=Vstupenka.Stav.VRACENA,
        upraveno=timezone.now(),
        posledni_zmenu_stavu_provedl=uzivatel,
    )

    if duvod:
        posledni_platba = objednavka.platby.order_by("-vytvoreno").first()
        if posledni_platba is not None:
            data = dict(posledni_platba.data_poskytovatele or {})
            data["duvod_vraceni"] = duvod
            data["vratil"] = getattr(uzivatel, "username", "")
            data["vraceno_v"] = timezone.now().isoformat()
            posledni_platba.data_poskytovatele = data
            posledni_platba.save(update_fields=["data_poskytovatele", "upraveno"])

    return objednavka


def _je_misto_volne_pro_presun(akce, kod: str, ignoruj_vstupenky: list[int] | None = None) -> bool:
    schema = ziskej_schema_sezeni_pro_akci(akce)
    platna = {misto["kod"] for misto in iteruj_mista_schema(schema)}
    if kod not in platna:
        raise ValueError("Cilove misto neexistuje v planu teto akce.")
    if ((getattr(akce, "manualni_stavy_mist", None) or {}).get(kod) or {}).get("stav") == "blokovano":
        raise ValueError("Cilove misto je rucne blokovane.")
    dotaz = Vstupenka.objects.filter(akce=akce, oznaceni_mista=kod).exclude(
        stav__in=[Vstupenka.Stav.ZRUSENA, Vstupenka.Stav.VRACENA]
    )
    if ignoruj_vstupenky:
        dotaz = dotaz.exclude(id__in=ignoruj_vstupenky)
    return not dotaz.exists()


@transaction.atomic
def presadit_vstupenku(objednavka: Objednavka, *, vstupenka_kod: str, nove_misto: str, uzivatel=None) -> Objednavka:
    vstupenka = objednavka.vstupenky.select_related("akce", "polozka_objednavky").filter(kod=vstupenka_kod).first()
    if not vstupenka:
        raise ValueError("Vstupenka v objednavce nebyla nalezena.")
    if not _je_misto_volne_pro_presun(vstupenka.akce, nove_misto, ignoruj_vstupenky=[vstupenka.id]):
        raise ValueError("Cilove misto je uz obsazene nebo rezervovane.")
    stare_misto = vstupenka.oznaceni_mista
    vstupenka.oznaceni_mista = nove_misto
    vstupenka.posledni_zmenu_stavu_provedl = uzivatel
    vstupenka.save(update_fields=["oznaceni_mista", "posledni_zmenu_stavu_provedl", "upraveno"])
    polozka = vstupenka.polozka_objednavky
    vybrana_mista = list(polozka.vybrana_mista or [])
    if stare_misto in vybrana_mista:
        vybrana_mista[vybrana_mista.index(stare_misto)] = nove_misto
        polozka.vybrana_mista = vybrana_mista
        polozka.save(update_fields=["vybrana_mista", "upraveno"])
    return objednavka


@transaction.atomic
def prohodit_mista_objednavky(
    objednavka: Objednavka, *, vstupenka_kod_a: str, vstupenka_kod_b: str, uzivatel=None
) -> Objednavka:
    if vstupenka_kod_a == vstupenka_kod_b:
        raise ValueError("Pro zameneni zvol dve ruzne vstupenky.")
    vstupenky = list(
        objednavka.vstupenky.select_related("polozka_objednavky").filter(kod__in=[vstupenka_kod_a, vstupenka_kod_b])
    )
    if len(vstupenky) != 2:
        raise ValueError("Obe vstupenky musi patrit do teto objednavky.")
    a, b = vstupenky
    a_misto, b_misto = a.oznaceni_mista, b.oznaceni_mista
    a.oznaceni_mista = b_misto
    b.oznaceni_mista = a_misto
    a.posledni_zmenu_stavu_provedl = uzivatel
    b.posledni_zmenu_stavu_provedl = uzivatel
    a.save(update_fields=["oznaceni_mista", "posledni_zmenu_stavu_provedl", "upraveno"])
    b.save(update_fields=["oznaceni_mista", "posledni_zmenu_stavu_provedl", "upraveno"])
    for vstupenka, stare, nove in ((a, a_misto, b_misto), (b, b_misto, a_misto)):
        polozka = vstupenka.polozka_objednavky
        vybrana_mista = list(polozka.vybrana_mista or [])
        if stare in vybrana_mista:
            vybrana_mista[vybrana_mista.index(stare)] = nove
            polozka.vybrana_mista = vybrana_mista
            polozka.save(update_fields=["vybrana_mista", "upraveno"])
    return objednavka
