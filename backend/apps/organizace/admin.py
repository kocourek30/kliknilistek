from django.contrib import admin

from .models import ClenstviOrganizace, Organizace


class ClenstviOrganizaceInline(admin.TabularInline):
    model = ClenstviOrganizace
    extra = 0
    autocomplete_fields = ["uzivatel"]


@admin.register(Organizace)
class OrganizaceAdmin(admin.ModelAdmin):
    list_display = (
        "nazev",
        "typ_organizace",
        "kontaktni_email",
        "kontaktni_telefon",
        "je_aktivni",
        "vytvoreno",
    )
    list_filter = ("typ_organizace", "je_aktivni")
    search_fields = ("nazev", "slug", "kontaktni_email", "kontaktni_telefon")
    prepopulated_fields = {"slug": ("nazev",)}
    inlines = [ClenstviOrganizaceInline]


@admin.register(ClenstviOrganizace)
class ClenstviOrganizaceAdmin(admin.ModelAdmin):
    list_display = ("organizace", "uzivatel", "role", "je_aktivni", "vytvoreno")
    list_filter = ("role", "je_aktivni", "organizace")
    search_fields = ("organizace__nazev", "uzivatel__username", "uzivatel__email")
    autocomplete_fields = ["organizace", "uzivatel"]
