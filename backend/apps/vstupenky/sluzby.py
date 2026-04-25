from io import BytesIO
from email.utils import formataddr

from django.conf import settings
from django.core.mail import EmailMessage, get_connection
from django.utils import timezone
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

from apps.jadro.models import NastaveniSystemu
from apps.jadro.sluzby import zaloguj_audit
from apps.objednavky.models import Objednavka
from apps.vstupenky.models import EmailovaZasilka, Vstupenka


def ziskej_globalni_smtp_nastaveni() -> NastaveniSystemu | None:
    return NastaveniSystemu.objects.filter(pk=1).first()


def ziskej_globalni_email_connection():
    nastaveni = ziskej_globalni_smtp_nastaveni()
    if nastaveni and nastaveni.smtp_aktivni and nastaveni.smtp_host:
        return get_connection(
            backend="django.core.mail.backends.smtp.EmailBackend",
            host=nastaveni.smtp_host,
            port=nastaveni.smtp_port or 587,
            username=nastaveni.smtp_uzivatel or "",
            password=nastaveni.smtp_heslo or "",
            use_tls=nastaveni.smtp_use_tls,
            use_ssl=nastaveni.smtp_use_ssl,
            timeout=nastaveni.smtp_timeout or 20,
        )
    return get_connection()


def ziskej_globalniho_odesilatele() -> str:
    nastaveni = ziskej_globalni_smtp_nastaveni()
    if nastaveni and nastaveni.smtp_aktivni and nastaveni.smtp_od_email:
        if nastaveni.smtp_od_jmeno:
            return formataddr((nastaveni.smtp_od_jmeno, nastaveni.smtp_od_email))
        return nastaveni.smtp_od_email
    return getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@kliknilistek.local")


def ziskej_email_connection_pro_organizaci(organizace):
    if organizace.smtp_aktivni and organizace.smtp_host:
        return get_connection(
            backend="django.core.mail.backends.smtp.EmailBackend",
            host=organizace.smtp_host,
            port=organizace.smtp_port or 587,
            username=organizace.smtp_uzivatel or "",
            password=organizace.smtp_heslo or "",
            use_tls=organizace.smtp_use_tls,
            use_ssl=organizace.smtp_use_ssl,
            timeout=organizace.smtp_timeout or 20,
        )
    return ziskej_globalni_email_connection()


def ziskej_odesilatele_pro_organizaci(organizace) -> str:
    if organizace.smtp_aktivni and organizace.smtp_od_email:
        if organizace.smtp_od_jmeno:
            return formataddr((organizace.smtp_od_jmeno, organizace.smtp_od_email))
        return organizace.smtp_od_email
    return ziskej_globalniho_odesilatele()


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
        f"Dobrý den,\n\n"
        f"k objednávce {objednavka.verejne_id} posíláme vstupenky na akci.\n"
        f"V e-mailu najdete PDF přílohy a vstupenky jsou dostupné i přes veřejný detail objednávky.\n\n"
        f"Objednávka: {objednavka.verejne_id}\n"
        f"Celkem: {objednavka.celkem} {objednavka.mena}\n\n"
        f"Děkujeme.\nKlikniListek"
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
        from_email=ziskej_odesilatele_pro_organizaci(objednavka.organizace),
        to=[objednavka.email_zakaznika],
        connection=ziskej_email_connection_pro_organizaci(objednavka.organizace),
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
        zaloguj_audit(
            organizace=objednavka.organizace,
            akce="vstupenky.email_chyba",
            objekt_typ="objednavka",
            objekt_id=str(objednavka.id),
            objekt_popis=objednavka.verejne_id,
            poznamka="Odeslání vstupenek e-mailem skončilo chybou.",
            data={"prijemce": objednavka.email_zakaznika, "chyba": str(error)},
        )
        raise

    cas_doruceni = timezone.now()
    objednavka.vstupenky.filter(
        stav__in=[Vstupenka.Stav.PLATNA, Vstupenka.Stav.ODBAVENA],
        dorucena__isnull=True,
    ).update(dorucena=cas_doruceni)
    zasilka.stav = EmailovaZasilka.Stav.ODESLANO
    zasilka.odeslano_v = cas_doruceni
    zasilka.save(update_fields=["stav", "odeslano_v", "upraveno"])
    zaloguj_audit(
        organizace=objednavka.organizace,
        akce="vstupenky.email_odeslan",
        objekt_typ="objednavka",
        objekt_id=str(objednavka.id),
        objekt_popis=objednavka.verejne_id,
        poznamka="Vstupenky byly úspěšně doručeny e-mailem.",
        data={"prijemce": objednavka.email_zakaznika, "pocet_vstupenek": len(vstupenky)},
    )

    return objednavka
