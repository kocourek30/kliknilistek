from django.contrib import admin

from .models import AuditniLog, NastaveniSystemu


@admin.register(AuditniLog)
class AuditniLogAdmin(admin.ModelAdmin):
    list_display = ("vytvoreno", "akce", "organizace", "uzivatel", "objekt_typ", "objekt_popis")
    list_filter = ("akce", "organizace", "objekt_typ", "vytvoreno")
    search_fields = ("akce", "objekt_typ", "objekt_id", "objekt_popis", "poznamka", "uzivatel__username")
    readonly_fields = ("vytvoreno", "upraveno")


@admin.register(NastaveniSystemu)
class NastaveniSystemuAdmin(admin.ModelAdmin):
    list_display = ("id", "smtp_aktivni", "smtp_host", "smtp_port", "smtp_od_email", "upraveno")
