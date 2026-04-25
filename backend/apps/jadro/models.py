from django.db import models


class CasovyModel(models.Model):
    vytvoreno = models.DateTimeField(auto_now_add=True)
    upraveno = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ModelOrganizace(CasovyModel):
    organizace = models.ForeignKey("organizace.Organizace", on_delete=models.CASCADE)

    class Meta:
        abstract = True
