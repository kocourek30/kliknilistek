from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("akce", "0004_mistokonani_schema_sezeni"),
    ]

    operations = [
        migrations.AddField(
            model_name="akce",
            name="manualni_stavy_mist",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="akce",
            name="schema_sezeni_override",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="kategorievstupenky",
            name="povolene_zony",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
