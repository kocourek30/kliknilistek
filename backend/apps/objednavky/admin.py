from django.contrib import admin

from .models import Objednavka, PolozkaObjednavky


class PolozkaObjednavkyInline(admin.TabularInline):
    model = PolozkaObjednavky
    extra = 0
    autocomplete_fields = ["akce", "kategorie_vstupenky"]
    readonly_fields = ("cena_celkem",)


@admin.register(Objednavka)
class ObjednavkaAdmin(admin.ModelAdmin):
    list_display = (
        "verejne_id",
        "organizace",
        "email_zakaznika",
        "stav",
        "celkem",
        "mena",
        "rezervace_do",
        "vytvoreno",
    )
    list_filter = ("organizace", "stav", "mena", "vytvoreno")
    search_fields = (
        "verejne_id",
        "email_zakaznika",
        "jmeno_zakaznika",
        "telefon_zakaznika",
        "organizace__nazev",
    )
    autocomplete_fields = ["organizace", "vytvoril"]
    readonly_fields = ("verejne_id", "mezisoucet", "poplatek", "celkem", "vytvoreno", "upraveno")
    inlines = [PolozkaObjednavkyInline]
    date_hierarchy = "vytvoreno"


@admin.register(PolozkaObjednavky)
class PolozkaObjednavkyAdmin(admin.ModelAdmin):
    list_display = (
        "objednavka",
        "akce",
        "kategorie_vstupenky",
        "pocet",
        "cena_za_kus",
        "cena_celkem",
    )
    list_filter = ("organizace", "akce")
    search_fields = (
        "objednavka__verejne_id",
        "akce__nazev",
        "kategorie_vstupenky__nazev",
        "organizace__nazev",
    )
    autocomplete_fields = ["organizace", "objednavka", "akce", "kategorie_vstupenky"]
