from django.contrib import admin

from .models import ProformaDoklad


@admin.register(ProformaDoklad)
class ProformaDokladAdmin(admin.ModelAdmin):
    list_display = ("cislo_dokladu", "objednavka", "stav", "castka", "datum_vystaveni", "datum_splatnosti")
    list_filter = ("stav", "mena", "datum_vystaveni")
    search_fields = ("cislo_dokladu", "objednavka__verejne_id", "variabilni_symbol")

