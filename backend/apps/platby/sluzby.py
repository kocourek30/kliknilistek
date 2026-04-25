from uuid import uuid4

from django.db import transaction

from apps.objednavky.models import Objednavka
from apps.objednavky.sluzby import potvrdit_uhradu_objednavky, zneplatni_propadlou_objednavku

from .models import Platba


@transaction.atomic
def simulovat_uspesnou_platbu(
    objednavka: Objednavka,
    poskytovatel: str,
) -> Platba:
    objednavka = zneplatni_propadlou_objednavku(objednavka)

    if objednavka.stav == Objednavka.Stav.ZRUSENO:
        raise ValueError("Rezervace uz vyprsela a objednavku nelze zaplatit.")

    if objednavka.stav == Objednavka.Stav.ZAPLACENO:
        existujici = objednavka.platby.filter(stav=Platba.Stav.USPESNA).order_by("-vytvoreno").first()
        if existujici is not None:
            return existujici

    reference = uuid4().hex[:16].upper()
    potvrdit_uhradu_objednavky(
        objednavka,
        poskytovatel=poskytovatel,
        reference_poskytovatele=reference,
        data_poskytovatele={
            "typ": "simulace",
            "reference": reference,
        },
    )
    return objednavka.platby.filter(reference_poskytovatele=reference).first()
