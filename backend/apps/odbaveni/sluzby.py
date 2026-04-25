from django.db import transaction

from apps.vstupenky.models import Vstupenka

from .models import Odbaveni


@transaction.atomic
def zpracuj_odbaveni(kod: str, oznaceni_zarizeni: str = ""):
    vstupenka = Vstupenka.objects.select_related("akce", "organizace").filter(kod=kod).first()

    if vstupenka is None:
        Odbaveni.objects.create(
            organizace_id=1,
            vysledek=Odbaveni.Vysledek.NEPLATNE,
            naskenovany_kod=kod,
            oznaceni_zarizeni=oznaceni_zarizeni,
        )
        return {
            "vysledek": Odbaveni.Vysledek.NEPLATNE,
            "stav_vstupenky": "nenalezena",
            "zprava": "Vstupenka s timto kodem nebyla nalezena.",
            "vstupenka": None,
        }

    if vstupenka.stav == Vstupenka.Stav.ODBAVENA:
        Odbaveni.objects.create(
            organizace=vstupenka.organizace,
            vstupenka=vstupenka,
            akce=vstupenka.akce,
            vysledek=Odbaveni.Vysledek.DUPLICITNI,
            naskenovany_kod=kod,
            oznaceni_zarizeni=oznaceni_zarizeni,
        )
        return {
            "vysledek": Odbaveni.Vysledek.DUPLICITNI,
            "stav_vstupenky": vstupenka.stav,
            "zprava": "Tato vstupenka uz byla drive odbavena.",
            "vstupenka": vstupenka,
        }

    if vstupenka.stav != Vstupenka.Stav.PLATNA:
        Odbaveni.objects.create(
            organizace=vstupenka.organizace,
            vstupenka=vstupenka,
            akce=vstupenka.akce,
            vysledek=Odbaveni.Vysledek.ODMITNUTO,
            naskenovany_kod=kod,
            oznaceni_zarizeni=oznaceni_zarizeni,
        )
        return {
            "vysledek": Odbaveni.Vysledek.ODMITNUTO,
            "stav_vstupenky": vstupenka.stav,
            "zprava": "Vstupenka neni ve stavu, ktery by umoznil vstup.",
            "vstupenka": vstupenka,
        }

    vstupenka.stav = Vstupenka.Stav.ODBAVENA
    vstupenka.save(update_fields=["stav", "upraveno"])
    Odbaveni.objects.create(
        organizace=vstupenka.organizace,
        vstupenka=vstupenka,
        akce=vstupenka.akce,
        vysledek=Odbaveni.Vysledek.POVOLENO,
        naskenovany_kod=kod,
        oznaceni_zarizeni=oznaceni_zarizeni,
    )
    return {
        "vysledek": Odbaveni.Vysledek.POVOLENO,
        "stav_vstupenky": vstupenka.stav,
        "zprava": "Vstup povolen. Vstupenka byla uspesne odbavena.",
        "vstupenka": vstupenka,
    }
