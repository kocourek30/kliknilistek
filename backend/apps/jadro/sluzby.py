from __future__ import annotations

from typing import Any

from .models import AuditniLog


def zaloguj_audit(
    *,
    organizace,
    akce: str,
    uzivatel=None,
    objekt_typ: str = "",
    objekt_id: str = "",
    objekt_popis: str = "",
    poznamka: str = "",
    data: dict[str, Any] | None = None,
) -> AuditniLog:
    return AuditniLog.objects.create(
        organizace=organizace,
        uzivatel=uzivatel,
        akce=akce,
        objekt_typ=objekt_typ,
        objekt_id=objekt_id,
        objekt_popis=objekt_popis,
        poznamka=poznamka,
        data=data or {},
    )

