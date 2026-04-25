from io import BytesIO

from django.conf import settings
from django.core.mail import EmailMessage
from django.utils import timezone
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from apps.objednavky.models import Objednavka
from apps.vstupenky.models import EmailovaZasilka, Vstupenka


def vytvor_pdf_vstupenky(vstupenka: Vstupenka) -> bytes:
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    sirka, vyska = A4

    pdf.setTitle(f"Vstupenka {vstupenka.kod}")
    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawString(24 * mm, vyska - 28 * mm, "KlikniListek")
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(24 * mm, vyska - 42 * mm, vstupenka.akce.nazev)

    pdf.setFont("Helvetica", 11)
    radky = [
        ("Kod vstupenky", vstupenka.kod),
        ("Kategorie", vstupenka.kategorie_vstupenky.nazev),
        ("Navstevnik", vstupenka.jmeno_navstevnika or "Neuvedeno"),
        ("E-mail", vstupenka.email_navstevnika or "Neuvedeno"),
        ("Misto", vstupenka.akce.misto_konani.nazev),
        ("Zacatek", timezone.localtime(vstupenka.akce.zacatek).strftime("%d.%m.%Y %H:%M")),
    ]

    y = vyska - 62 * mm
    for popisek, hodnota in radky:
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(24 * mm, y, f"{popisek}:")
        pdf.setFont("Helvetica", 11)
        pdf.drawString(62 * mm, y, str(hodnota))
        y -= 8 * mm

    qr = QrCodeWidget(vstupenka.qr_data)
    bounds = qr.getBounds()
    velikost = 42 * mm
    drawing = Drawing(velikost, velikost, transform=[velikost / (bounds[2] - bounds[0]), 0, 0, velikost / (bounds[3] - bounds[1]), 0, 0])
    drawing.add(qr)
    renderPDF.draw(drawing, pdf, 24 * mm, vyska - 145 * mm)

    pdf.setFont("Helvetica", 10)
    pdf.drawString(24 * mm, vyska - 152 * mm, "QR predlozte pri vstupu.")
    pdf.drawString(24 * mm, vyska - 158 * mm, f"Kontrolni data: {vstupenka.qr_data}")

    pdf.showPage()
    pdf.save()
    return buffer.getvalue()


def sestav_text_emailu(objednavka: Objednavka) -> str:
    return (
        f"Dobry den,\n\n"
        f"k objednavce {objednavka.verejne_id} posilame vstupenky na akci.\n"
        f"V e-mailu najdete PDF prilohy a vstupenky jsou dostupne i pres verejny detail objednavky.\n\n"
        f"Objednavka: {objednavka.verejne_id}\n"
        f"Celkem: {objednavka.celkem} {objednavka.mena}\n\n"
        f"Dekujeme.\nKlikniListek"
    )


def odeslat_vstupenky_objednavky(objednavka: Objednavka):
    if objednavka.stav != Objednavka.Stav.ZAPLACENO:
        raise ValueError("Vstupenky lze dorucit az po zaplaceni objednavky.")

    vstupenky = list(
        objednavka.vstupenky.select_related(
            "akce__misto_konani",
            "kategorie_vstupenky",
        ).filter(stav__in=[Vstupenka.Stav.PLATNA, Vstupenka.Stav.ODBAVENA])
    )
    if not vstupenky:
        raise ValueError("Objednavka nema zadne platne vstupenky k doruceni.")

    text_emailu = sestav_text_emailu(objednavka)
    zasilka = EmailovaZasilka.objects.create(
        organizace=objednavka.organizace,
        objednavka=objednavka,
        prijemce_email=objednavka.email_zakaznika,
        predmet=f"Vstupenky k objednavce {objednavka.verejne_id}",
        stav=EmailovaZasilka.Stav.VYTVORENO,
        text_zpravy=text_emailu,
        pocet_priloh=len(vstupenky),
    )

    email = EmailMessage(
        subject=zasilka.predmet,
        body=text_emailu,
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@kliknilistek.local"),
        to=[objednavka.email_zakaznika],
    )
    for poradi, vstupenka in enumerate(vstupenky, start=1):
        email.attach(
            f"vstupenka-{objednavka.verejne_id}-{poradi}.pdf",
            vytvor_pdf_vstupenky(vstupenka),
            "application/pdf",
        )

    try:
        email.send(fail_silently=False)
    except Exception as error:
        zasilka.stav = EmailovaZasilka.Stav.CHYBA
        zasilka.chyba_text = str(error)
        zasilka.save(update_fields=["stav", "chyba_text", "upraveno"])
        raise

    cas_doruceni = timezone.now()
    objednavka.vstupenky.filter(
        stav__in=[Vstupenka.Stav.PLATNA, Vstupenka.Stav.ODBAVENA],
        dorucena__isnull=True,
    ).update(dorucena=cas_doruceni)
    zasilka.stav = EmailovaZasilka.Stav.ODESLANO
    zasilka.odeslano_v = cas_doruceni
    zasilka.save(update_fields=["stav", "odeslano_v", "upraveno"])

    return objednavka
