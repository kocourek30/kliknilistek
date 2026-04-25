from django.contrib import admin

from .models import EmailovaZasilka, Vstupenka


@admin.register(Vstupenka)
class VstupenkaAdmin(admin.ModelAdmin):
    list_display = (
        "kod",
        "organizace",
        "akce",
        "kategorie_vstupenky",
        "stav",
        "email_navstevnika",
        "vystavena",
        "dorucena",
    )
    list_filter = ("organizace", "stav", "akce", "kategorie_vstupenky")
    search_fields = (
        "kod",
        "qr_data",
        "email_navstevnika",
        "jmeno_navstevnika",
        "objednavka__verejne_id",
        "akce__nazev",
    )
    autocomplete_fields = [
        "organizace",
        "objednavka",
        "polozka_objednavky",
        "akce",
        "kategorie_vstupenky",
        "posledni_zmenu_stavu_provedl",
    ]
    readonly_fields = ("kod", "qr_data", "vystavena")


@admin.register(EmailovaZasilka)
class EmailovaZasilkaAdmin(admin.ModelAdmin):
    list_display = (
        "objednavka",
        "prijemce_email",
        "stav",
        "pocet_priloh",
        "odeslano_v",
        "vytvoreno",
    )
    list_filter = ("organizace", "stav", "vytvoreno")
    search_fields = ("objednavka__verejne_id", "prijemce_email", "predmet")
    autocomplete_fields = ["organizace", "objednavka"]
    readonly_fields = ("odeslano_v", "vytvoreno", "upraveno")
