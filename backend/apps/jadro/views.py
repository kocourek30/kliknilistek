from django.core.mail import EmailMessage
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jadro.sluzby import zaloguj_audit
from apps.organizace.serializery import OrganizaceSerializer
from apps.vstupenky.sluzby import ziskej_globalni_email_connection, ziskej_globalniho_odesilatele

from .models import NastaveniSystemu
from .permissions import MuzeSpravovatObsah
from .serializery import NastaveniSystemuSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def koren_api(request):
    return Response(
        {
            "nazev": "KlikniListek API",
            "verze": "0.1.0",
            "moduly": [
                "organizace",
                "akce",
                "objednavky",
                "platby",
                "vstupenky",
                "odbaveni",
                "prehledy",
            ],
            "dostupne_cesty": {
                "organizace": "/api/organizace/",
                "clenstvi_organizace": "/api/organizace/clenstvi/",
                "akce": "/api/akce/",
                "mista_konani": "/api/akce/mista-konani/",
                "kategorie_vstupenek": "/api/akce/kategorie-vstupenek/",
            },
        }
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def tenant_kontext_api(request):
    tenant_organizace = getattr(request, "tenant_organizace", None)
    return Response(
        {
            "host": getattr(getattr(request, "tenant_kontext", None), "host", ""),
            "je_centralni": tenant_organizace is None,
            "organizace": OrganizaceSerializer(tenant_organizace).data if tenant_organizace else None,
        }
    )


class NastaveniSystemuView(APIView):
    permission_classes = [IsAuthenticated, MuzeSpravovatObsah]

    def get_objekt(self):
        objekt, _ = NastaveniSystemu.objects.get_or_create(pk=1)
        return objekt

    def get(self, request):
        serializer = NastaveniSystemuSerializer(self.get_objekt())
        return Response(serializer.data)

    def patch(self, request):
        objekt = self.get_objekt()
        serializer = NastaveniSystemuSerializer(objekt, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TestSmtpView(APIView):
    permission_classes = [IsAuthenticated, MuzeSpravovatObsah]

    def post(self, request):
        cilovy_email = (request.data.get("email") or "").strip()
        if not cilovy_email:
            return Response({"detail": "Zadej cílový e-mail pro testovací zprávu."}, status=status.HTTP_400_BAD_REQUEST)
        clenstvi = request.user.clenstvi_organizaci.filter(je_aktivni=True).select_related("organizace").first()
        organizace = clenstvi.organizace if clenstvi else None

        email = EmailMessage(
            subject="Test SMTP z KlikniLístku",
            body=(
                "Dobrý den,\n\n"
                "tohle je testovací zpráva z výchozího SMTP nastavení platformy KlikniLístek.\n\n"
                "Pokud jste ji obdrželi, globální odesílání je nastavené správně.\n\n"
                "KlikniLístek"
            ),
            from_email=ziskej_globalniho_odesilatele(),
            to=[cilovy_email],
            connection=ziskej_globalni_email_connection(),
        )
        try:
            email.send(fail_silently=False)
        except Exception as error:
            return Response({"detail": f"Testovací e-mail se nepodařilo odeslat: {error}"}, status=status.HTTP_400_BAD_REQUEST)

        zaloguj_audit(
            organizace=organizace,
            uzivatel=request.user,
            akce="system.smtp_test_odeslan",
            objekt_typ="nastaveni_systemu",
            objekt_id="1",
            objekt_popis="Globální SMTP",
            poznamka="Byl odeslán testovací e-mail z globálního SMTP.",
            data={"cilovy_email": cilovy_email},
        )
        return Response({"detail": f"Testovací e-mail byl odeslán na {cilovy_email}."})
