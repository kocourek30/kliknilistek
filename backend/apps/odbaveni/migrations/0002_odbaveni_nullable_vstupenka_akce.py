from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("odbaveni", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="odbaveni",
            name="akce",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="odbaveni",
                to="akce.akce",
            ),
        ),
        migrations.AlterField(
            model_name="odbaveni",
            name="vstupenka",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="odbaveni",
                to="vstupenky.vstupenka",
            ),
        ),
    ]
