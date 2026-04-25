from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("objednavky", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="objednavka",
            name="rezervace_do",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
