# Generated manually to add date range fields to Invoice model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0005_invoice_invoiceline'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='start_date',
            field=models.DateField(blank=True, help_text='Start of the invoice period (week range)', null=True),
        ),
        migrations.AddField(
            model_name='invoice',
            name='end_date',
            field=models.DateField(blank=True, help_text='End of the invoice period (week range)', null=True),
        ),
    ]

