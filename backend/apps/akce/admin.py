from django.contrib import admin

from .models import Akce, KategorieVstupenky, MistoKonani


class KategorieVstupenkyInline(admin.TabularInline):
    model = KategorieVstupenky
    extra = 0


@admin.register(MistoKonani)
class MistoKonaniAdmin(admin.ModelAdmin):
    list_display = ("nazev", "organizace", "mesto", "kapacita", "vytvoreno")
    list_filter = ("organizace", "mesto")
    search_fields = ("nazev", "adresa", "mesto", "organizace__nazev")
    autocomplete_fields = ["organizace"]


@admin.register(Akce)
class AkceAdmin(admin.ModelAdmin):
    list_display = (
        "nazev",
        "organizace",
        "misto_konani",
        "zacatek",
        "stav",
        "kapacita",
        "rezervace_platnost_minuty",
        "je_doporucena",
    )
    list_filter = ("organizace", "stav", "je_doporucena", "zacatek")
    search_fields = ("nazev", "slug", "popis", "organizace__nazev", "misto_konani__nazev")
    date_hierarchy = "zacatek"
    autocomplete_fields = ["organizace", "misto_konani"]
    prepopulated_fields = {"slug": ("nazev",)}
    inlines = [KategorieVstupenkyInline]


@admin.register(KategorieVstupenky)
class KategorieVstupenkyAdmin(admin.ModelAdmin):
    list_display = (
        "nazev",
        "akce",
        "organizace",
        "cena",
        "mena",
        "kapacita",
        "je_aktivni",
        "prodej_od",
        "prodej_do",
    )
    list_filter = ("organizace", "je_aktivni", "mena", "akce")
    search_fields = ("nazev", "popis", "akce__nazev", "organizace__nazev")
    autocomplete_fields = ["organizace", "akce"]
