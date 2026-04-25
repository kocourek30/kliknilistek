import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "1").lower() in {"1", "true", "yes", "on"}
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "jazzmin",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "apps.jadro",
    "apps.organizace",
    "apps.uzivatele",
    "apps.akce",
    "apps.objednavky",
    "apps.vstupenky",
    "apps.platby",
    "apps.fakturace",
    "apps.odbaveni",
    "apps.prehledy",
]

JAZZMIN_SETTINGS = {
    "site_title": "KlikniListek Sprava",
    "site_header": "KlikniListek",
    "site_brand": "KlikniListek",
    "site_logo_classes": "img-circle",
    "welcome_sign": "Provozni administrace kulturnich akci",
    "copyright": "KlikniListek",
    "search_model": ["organizace.Organizace", "akce.Akce", "objednavky.Objednavka", "vstupenky.Vstupenka"],
    "topmenu_links": [
        {"name": "Portal", "url": "http://127.0.0.1:3001", "new_window": True},
        {"name": "Objednavky", "model": "objednavky.Objednavka"},
        {"name": "Akce", "model": "akce.Akce"},
        {"name": "Vstupenky", "model": "vstupenky.Vstupenka"},
    ],
    "order_with_respect_to": [
        "organizace",
        "akce",
        "objednavky",
        "fakturace",
        "vstupenky",
        "auth",
    ],
    "icons": {
        "organizace.Organizace": "fas fa-building",
        "organizace.ClenstviOrganizace": "fas fa-user-shield",
        "akce.MistoKonani": "fas fa-location-dot",
        "akce.Akce": "fas fa-calendar-days",
        "akce.KategorieVstupenky": "fas fa-ticket",
        "objednavky.Objednavka": "fas fa-cart-shopping",
        "objednavky.PolozkaObjednavky": "fas fa-list",
        "fakturace.ProformaDoklad": "fas fa-file-invoice-dollar",
        "vstupenky.Vstupenka": "fas fa-qrcode",
        "auth.User": "fas fa-user",
        "auth.Group": "fas fa-users",
    },
    "custom_links": {
        "organizace": [
            {
                "name": "Verejny portal",
                "url": "http://127.0.0.1:3001",
                "icon": "fas fa-arrow-up-right-from-square",
                "new_window": True,
            }
        ]
    },
}

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "config.middleware.ApiCorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

if os.getenv("DATABASE_URL") or os.getenv("POSTGRES_HOST"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB", "kliknilistek"),
            "USER": os.getenv("POSTGRES_USER", "kliknilistek"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", "kliknilistek"),
            "HOST": os.getenv("POSTGRES_HOST", "localhost"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "cs-cz"
TIME_ZONE = "Europe/Prague"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "0").lower() in {"1", "true", "yes", "on"}
SESSION_COOKIE_SECURE = os.getenv("DJANGO_SESSION_COOKIE_SECURE", "0").lower() in {"1", "true", "yes", "on"}
CSRF_COOKIE_SECURE = os.getenv("DJANGO_CSRF_COOKIE_SECURE", "0").lower() in {"1", "true", "yes", "on"}

EMAIL_BACKEND = os.getenv("DJANGO_EMAIL_BACKEND", "django.core.mail.backends.filebased.EmailBackend")
EMAIL_FILE_PATH = BASE_DIR / "odeslane_emaily"
DEFAULT_FROM_EMAIL = os.getenv("DJANGO_DEFAULT_FROM_EMAIL", "KlikniListek <noreply@kliknilistek.local>")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

MIGRATION_MODULES = {
    "auth": "config.migrace_auth",
}
