from django.db import models


class CasovyModel(models.Model):
    vytvoreno = models.DateTimeField(auto_now_add=True)
    upraveno = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ModelOrganizace(CasovyModel):
    organizace = models.ForeignKey("organizace.Organizace", on_delete=models.CASCADE)

    class Meta:
        abstract = True


class AuditniLog(ModelOrganizace):
    uzivatel = models.ForeignKey(
        "auth.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="auditni_zaznamy",
    )
    akce = models.CharField(max_length=120)
    objekt_typ = models.CharField(max_length=80, blank=True)
    objekt_id = models.CharField(max_length=64, blank=True)
    objekt_popis = models.CharField(max_length=255, blank=True)
    poznamka = models.TextField(blank=True)
    data = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-vytvoreno"]
        verbose_name = "Auditní log"
        verbose_name_plural = "Auditní logy"

    def __str__(self) -> str:
        cil = self.objekt_popis or self.objekt_typ or "Záznam"
        return f"{self.akce} · {cil}"


class NastaveniSystemu(CasovyModel):
    smtp_aktivni = models.BooleanField(default=False)
    smtp_host = models.CharField(max_length=255, blank=True)
    smtp_port = models.PositiveIntegerField(default=587)
    smtp_uzivatel = models.CharField(max_length=255, blank=True)
    smtp_heslo = models.CharField(max_length=255, blank=True)
    smtp_use_tls = models.BooleanField(default=True)
    smtp_use_ssl = models.BooleanField(default=False)
    smtp_od_email = models.EmailField(blank=True)
    smtp_od_jmeno = models.CharField(max_length=255, blank=True)
    smtp_timeout = models.PositiveIntegerField(default=20)

    class Meta:
        verbose_name = "Nastavení systému"
        verbose_name_plural = "Nastavení systému"

    def __str__(self) -> str:
        return "Globální nastavení systému"
