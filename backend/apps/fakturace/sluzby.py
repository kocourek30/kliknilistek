from datetime import timedelta
from decimal import Decimal
from io import BytesIO

from django.utils import timezone
from reportlab.graphics import renderPDF, renderSVG
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from django.core.mail import EmailMessage

from apps.jadro.sluzby import zaloguj_audit
from apps.vstupenky.models import EmailovaZasilka
from apps.vstupenky.sluzby import (
    ziskej_email_connection_pro_organizaci,
    ziskej_odesilatele_pro_organizaci,
)

from .models import ProformaDoklad


def _jen_cislice(hodnota: str) -> str:
    return "".join(znak for znak in (hodnota or "") if znak.isdigit())


def sestav_iban_cz(cislo_uctu: str, kod_banky: str) -> str:
    kod_banky_cisty = _jen_cislice(kod_banky).zfill(4)
    prefix = ""
    zaklad = cislo_uctu or ""
    if "-" in zaklad:
        prefix, zaklad = zaklad.split("-", 1)
    prefix_cisty = _jen_cislice(prefix).zfill(6)
    ucet_cisty = _jen_cislice(zaklad).zfill(10)
    bban = f"{kod_banky_cisty}{prefix_cisty}{ucet_cisty}"
    prevod = "".join(str(int(znak, 36)) for znak in f"{bban}CZ00")
    kontrola = 98 - (int(prevod) % 97)
    return f"CZ{kontrola:02d}{bban}"


def sestav_spd_pro_platbu(
    *,
    iban: str,
    castka: Decimal,
    mena: str,
    variabilni_symbol: str,
    zprava: str,
) -> str:
    castka_text = f"{castka:.2f}"
    casti = [
        "SPD",
        "1.0",
        f"ACC:{iban.replace(' ', '')}",
        f"AM:{castka_text}",
        f"CC:{mena}",
        f"X-VS:{variabilni_symbol}",
        f"MSG:{zprava[:60]}",
    ]
    return "*".join(casti)


def vytvor_qr_svg(data: str, velikost: int = 168) -> str:
    qr = QrCodeWidget(data)
    bounds = qr.getBounds()
    drawing = Drawing(
        velikost,
        velikost,
        transform=[
            velikost / (bounds[2] - bounds[0]),
            0,
            0,
            velikost / (bounds[3] - bounds[1]),
            0,
            0,
        ],
    )
    drawing.add(qr)
    vystup = renderSVG.drawToString(drawing)
    return vystup.decode("utf-8") if isinstance(vystup, bytes) else vystup


def vytvor_pdf_proformy(proforma: ProformaDoklad) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    sirka, vyska = A4
    organizace = proforma.organizace

    pdf.setTitle(f"Proforma {proforma.cislo_dokladu}")
    pdf.setFont("Helvetica-Bold", 22)
    pdf.drawString(20 * mm, vyska - 24 * mm, "KlikniLístek")
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(20 * mm, vyska - 36 * mm, "Proforma doklad")

    pdf.setFont("Helvetica", 10)
    leva_cast = [
        organizace.fakturacni_nazev or organizace.nazev,
        organizace.fakturacni_ulice or "",
        f"{organizace.fakturacni_psc} {organizace.fakturacni_mesto}".strip(),
        f"IČO: {organizace.ico}" if organizace.ico else "",
        f"DIČ: {organizace.dic}" if organizace.dic else "",
    ]
    y = vyska - 50 * mm
    for radek in [radek for radek in leva_cast if radek]:
        pdf.drawString(20 * mm, y, radek)
        y -= 5.5 * mm

    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(110 * mm, vyska - 50 * mm, "Odběratel")
    pdf.setFont("Helvetica", 10)
    odberatel = [
        proforma.objednavka.jmeno_zakaznika or "Zákazník",
        proforma.objednavka.email_zakaznika,
        proforma.objednavka.telefon_zakaznika or "",
    ]
    y = vyska - 56 * mm
    for radek in [radek for radek in odberatel if radek]:
        pdf.drawString(110 * mm, y, radek)
        y -= 5.5 * mm

    pdf.setFont("Helvetica-Bold", 11)
    info_radky = [
        ("Číslo dokladu", proforma.cislo_dokladu),
        ("Objednávka", proforma.objednavka.verejne_id),
        ("Vystaveno", proforma.datum_vystaveni.strftime("%d.%m.%Y")),
        ("Splatnost", proforma.datum_splatnosti.strftime("%d.%m.%Y")),
        ("Variabilní symbol", proforma.variabilni_symbol),
        ("Částka", f"{proforma.castka:.2f} {proforma.mena}"),
        ("Účet", f"{organizace.cislo_uctu}/{organizace.kod_banky}".strip("/")),
    ]
    y = vyska - 90 * mm
    for popisek, hodnota in info_radky:
        pdf.drawString(20 * mm, y, f"{popisek}:")
        pdf.setFont("Helvetica", 11)
        pdf.drawString(62 * mm, y, str(hodnota))
        pdf.setFont("Helvetica-Bold", 11)
        y -= 7 * mm

    if proforma.qr_platba_data:
        qr = QrCodeWidget(proforma.qr_platba_data)
        bounds = qr.getBounds()
        velikost = 46 * mm
        drawing = Drawing(
            velikost,
            velikost,
            transform=[velikost / (bounds[2] - bounds[0]), 0, 0, velikost / (bounds[3] - bounds[1]), 0, 0],
        )
        drawing.add(qr)
        renderPDF.draw(drawing, pdf, 20 * mm, vyska - 170 * mm)
        pdf.setFont("Helvetica", 10)
        pdf.drawString(20 * mm, vyska - 176 * mm, "QR platba")

    pdf.setFont("Helvetica", 10)
    pdf.drawString(80 * mm, vyska - 130 * mm, "Po přijetí platby budou vstupenky automaticky doručeny e-mailem.")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def sestav_text_emailu_proformy(proforma: ProformaDoklad) -> str:
    return (
        f"Dobrý den,\n\n"
        f"k objednávce {proforma.objednavka.verejne_id} posíláme proforma doklad k bankovnímu převodu.\n"
        f"V příloze najdete PDF s QR platbou, variabilním symbolem a platebními údaji.\n\n"
        f"Číslo dokladu: {proforma.cislo_dokladu}\n"
        f"Částka: {proforma.castka:.2f} {proforma.mena}\n"
        f"Variabilní symbol: {proforma.variabilni_symbol}\n"
        f"Splatnost: {proforma.datum_splatnosti.strftime('%d.%m.%Y')}\n\n"
        f"Po přijetí platby se vstupenky automaticky odešlou e-mailem.\n\n"
        f"Děkujeme.\nKlikniLístek"
    )


def odeslat_proformu_objednavky(proforma: ProformaDoklad):
    objednavka = proforma.objednavka
    text_emailu = sestav_text_emailu_proformy(proforma)
    zasilka = EmailovaZasilka.objects.create(
        organizace=objednavka.organizace,
        objednavka=objednavka,
        prijemce_email=objednavka.email_zakaznika,
        predmet=f"Proforma k objednávce {objednavka.verejne_id}",
        stav=EmailovaZasilka.Stav.VYTVORENO,
        text_zpravy=text_emailu,
        pocet_priloh=1,
    )

    email = EmailMessage(
        subject=zasilka.predmet,
        body=text_emailu,
        from_email=ziskej_odesilatele_pro_organizaci(objednavka.organizace),
        to=[objednavka.email_zakaznika],
        connection=ziskej_email_connection_pro_organizaci(objednavka.organizace),
    )
    email.attach(
        f"proforma-{proforma.cislo_dokladu}.pdf",
        vytvor_pdf_proformy(proforma),
        "application/pdf",
    )

    try:
        email.send(fail_silently=False)
    except Exception as error:
        zasilka.stav = EmailovaZasilka.Stav.CHYBA
        zasilka.chyba_text = str(error)
        zasilka.save(update_fields=["stav", "chyba_text", "upraveno"])
        zaloguj_audit(
            organizace=proforma.organizace,
            akce="fakturace.proforma_email_chyba",
            objekt_typ="proforma",
            objekt_id=str(proforma.id),
            objekt_popis=proforma.cislo_dokladu,
            poznamka="Odeslání proforma dokladu e-mailem skončilo chybou.",
            data={"prijemce": objednavka.email_zakaznika, "chyba": str(error)},
        )
        raise

    cas_odeslani = timezone.now()
    zasilka.stav = EmailovaZasilka.Stav.ODESLANO
    zasilka.odeslano_v = cas_odeslani
    zasilka.save(update_fields=["stav", "odeslano_v", "upraveno"])
    zaloguj_audit(
        organizace=proforma.organizace,
        akce="fakturace.proforma_email_odeslan",
        objekt_typ="proforma",
        objekt_id=str(proforma.id),
        objekt_popis=proforma.cislo_dokladu,
        poznamka="Proforma byla úspěšně doručena e-mailem.",
        data={"prijemce": objednavka.email_zakaznika},
    )
    return proforma


def vytvor_nebo_aktualizuj_proformu(objednavka):
    organizace = objednavka.organizace
    if not organizace.cislo_uctu or not organizace.kod_banky:
        raise ValueError("Organizace nemá vyplněné číslo účtu a kód banky pro vystavení proformy.")

    iban = organizace.iban or sestav_iban_cz(organizace.cislo_uctu, organizace.kod_banky)
    zprava = f"Objednávka {objednavka.verejne_id}"
    doklad, vytvoreno = ProformaDoklad.objects.get_or_create(
        objednavka=objednavka,
        defaults={
            "organizace": objednavka.organizace,
            "cislo_dokladu": dalsi_cislo_proformy(),
            "variabilni_symbol": objednavka.verejne_id[-10:],
            "datum_vystaveni": timezone.localdate(),
            "datum_splatnosti": timezone.localdate() + timedelta(days=3),
            "castka": objednavka.celkem,
            "mena": objednavka.mena,
            "zprava_pro_prijemce": zprava,
        },
    )
    doklad.datum_vystaveni = timezone.localdate()
    doklad.datum_splatnosti = timezone.localdate() + timedelta(days=3)
    doklad.castka = objednavka.celkem
    doklad.mena = objednavka.mena
    doklad.zprava_pro_prijemce = zprava
    doklad.qr_platba_data = sestav_spd_pro_platbu(
        iban=iban,
        castka=objednavka.celkem,
        mena=objednavka.mena,
        variabilni_symbol=doklad.variabilni_symbol,
        zprava=zprava,
    )
    doklad.save()
    if organizace.iban != iban:
        organizace.iban = iban
        organizace.save(update_fields=["iban", "upraveno"])
    zaloguj_audit(
        organizace=objednavka.organizace,
        akce="fakturace.proforma_vytvorena" if vytvoreno else "fakturace.proforma_aktualizovana",
        objekt_typ="proforma",
        objekt_id=str(doklad.id),
        objekt_popis=doklad.cislo_dokladu,
        poznamka="Proforma byla připravena pro bankovní převod objednávky.",
        data={
            "objednavka": objednavka.verejne_id,
            "castka": str(doklad.castka),
            "mena": doklad.mena,
            "variabilni_symbol": doklad.variabilni_symbol,
        },
    )
    return doklad


def dalsi_cislo_proformy() -> str:
    rok = timezone.localdate().year
    pocet = ProformaDoklad.objects.filter(cislo_dokladu__startswith=f"PF-{rok}-").count() + 1
    return f"PF-{rok}-{pocet:05d}"


def oznac_proformu_jako_zaplacenou(proforma: ProformaDoklad, *, uzivatel=None):
    if proforma.stav == ProformaDoklad.Stav.ZAPLACENO:
        return proforma

    from apps.objednavky.sluzby import potvrdit_uhradu_objednavky
    from apps.platby.models import Platba

    potvrdit_uhradu_objednavky(
        proforma.objednavka,
        poskytovatel=Platba.Poskytovatel.BANKOVNI_PREVOD,
        reference_poskytovatele=proforma.cislo_dokladu,
        uzivatel=uzivatel,
        odeslat_na_email=True,
        data_poskytovatele={
            "typ": "proforma",
            "cislo_dokladu": proforma.cislo_dokladu,
            "variabilni_symbol": proforma.variabilni_symbol,
        },
    )
    proforma.stav = ProformaDoklad.Stav.ZAPLACENO
    proforma.uhrazeno_v = timezone.now()
    proforma.potvrzeno_uzivatelem = uzivatel
    proforma.save(update_fields=["stav", "uhrazeno_v", "potvrzeno_uzivatelem", "upraveno"])
    zaloguj_audit(
        organizace=proforma.organizace,
        akce="fakturace.proforma_zaplacena",
        uzivatel=uzivatel,
        objekt_typ="proforma",
        objekt_id=str(proforma.id),
        objekt_popis=proforma.cislo_dokladu,
        poznamka="Proforma byla ručně označena jako zaplacená.",
        data={
            "objednavka": proforma.objednavka.verejne_id,
            "variabilni_symbol": proforma.variabilni_symbol,
        },
    )
    return proforma
