# Generated by Django 5.1.2 on 2025-04-17 08:22

import pgvector.django.vector
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0005_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='workspace',
            name='embedding',
            field=pgvector.django.vector.VectorField(blank=True, dimensions=1536, null=True),
        ),
    ]
