from django.http import HttpResponse

from apps.organizace.tenant import rozpoznej_tenant_z_hostu, ziskej_host_z_requestu


class ApiCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS" and request.path.startswith("/api/"):
            response = HttpResponse(status=200)
        else:
            response = self.get_response(request)

        if request.path.startswith("/api/"):
            response["Access-Control-Allow-Origin"] = "http://127.0.0.1:3001"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

        return response


class TenantContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tenant_kontext = rozpoznej_tenant_z_hostu(ziskej_host_z_requestu(request))
        request.tenant_kontext = tenant_kontext
        request.tenant_organizace = tenant_kontext.organizace
        request.je_centralni_portal = tenant_kontext.je_centralni
        return self.get_response(request)
