from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organizace", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AuditniLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vytvoreno", models.DateTimeField(auto_now_add=True)),
                ("upraveno", models.DateTimeField(auto_now=True)),
                ("akce", models.CharField(max_length=120)),
                ("objekt_typ", models.CharField(blank=True, max_length=80)),
                ("objekt_id", models.CharField(blank=True, max_length=64)),
                ("objekt_popis", models.CharField(blank=True, max_length=255)),
                ("poznamka", models.TextField(blank=True)),
                ("data", models.JSONField(blank=True, default=dict)),
                (
                    "organizace",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="organizace.organizace"),
                ),
                (
                    "uzivatel",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="auditni_zaznamy",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Auditní log",
                "verbose_name_plural": "Auditní logy",
                "ordering": ["-vytvoreno"],
            },
        ),
    ]
