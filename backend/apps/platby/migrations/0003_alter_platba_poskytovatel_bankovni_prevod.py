from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("platby", "0002_alter_platba_poskytovatel"),
    ]

    operations = [
        migrations.AlterField(
            model_name="platba",
            name="poskytovatel",
            field=models.CharField(
                choices=[
                    ("gopay", "GoPay"),
                    ("comgate", "Comgate"),
                    ("stripe", "Stripe"),
                    ("bankovni_prevod", "Bankovni prevod"),
                    ("hotovost", "Hotovost"),
                ],
                max_length=24,
            ),
        ),
    ]
