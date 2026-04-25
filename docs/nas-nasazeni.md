# Nasazení KlikniListek na NAS přes Cloudflare Tunnel

Tento postup připravuje online staging nebo první veřejné nasazení na NAS s Dockerem pro doménu `kliknilistek.online`.

## Co vznikne

- `frontend` poběží na portu `3000` uvnitř Docker sítě
- `backend` poběží na portu `8000` uvnitř Docker sítě
- `frontend` bude dostupný v LAN na `http://10.0.0.108:3002`
- `backend` bude dostupný v LAN na `http://10.0.0.108:8002`
- `db` a `redis` poběží interně
- `cloudflared` zveřejní frontend přes doménu `kliknilistek.online`

Backend není potřeba vystavovat samostatně do internetu. Frontend používá interní proxy a server-side volání do `http://backend:8000/api`.

## Soubory

- produkční compose: [C:\Users\TomášKocourek\Documents\Kliknilistek_v2\docker-compose.nas.yml](C:\Users\TomášKocourek\Documents\Kliknilistek_v2\docker-compose.nas.yml)
- šablona proměnných: [C:\Users\TomášKocourek\Documents\Kliknilistek_v2\.env.nas.example](C:\Users\TomášKocourek\Documents\Kliknilistek_v2\.env.nas.example)

## 1. Přihlášení na NAS

```bash
ssh uzivatel@10.0.0.108
```

## 2. Vytvoření složky projektu

```bash
mkdir -p /volume1/docker/kliknilistek
cd /volume1/docker/kliknilistek
```

## 3. Nahrání projektu na NAS

Z tvého počítače:

```bash
scp -r "C:\Users\TomášKocourek\Documents\Kliknilistek_v2\*" uzivatel@10.0.0.108:/volume1/docker/kliknilistek/
```

Pokud používáš Git na NAS, je ještě lepší repozitář tam rovnou klonovat.

## 4. Vytvoření `.env.nas`

Na NAS:

```bash
cd /volume1/docker/kliknilistek
cp .env.nas.example .env.nas
```

Pak uprav:

- `POSTGRES_PASSWORD`
- `DJANGO_SECRET_KEY`
- `CLOUDFLARED_TOKEN`
- `DJANGO_EMAIL_HOST`
- `DJANGO_EMAIL_HOST_USER`
- `DJANGO_EMAIL_HOST_PASSWORD`

## 5. Cloudflare Tunnel

V Cloudflare Tunnel nastav veřejný hostname:

- `kliknilistek.online` -> `http://frontend:3000`

Pokud budeš chtít i `www`, přidej:

- `www.kliknilistek.online` -> `http://frontend:3000`

## 6. Sestavení a spuštění

Na NAS:

```bash
cd /volume1/docker/kliknilistek
docker compose -f docker-compose.nas.yml --env-file .env.nas build
docker compose -f docker-compose.nas.yml --env-file .env.nas up -d
```

## 7. Kontrola logů

```bash
docker compose -f docker-compose.nas.yml --env-file .env.nas logs -f frontend
docker compose -f docker-compose.nas.yml --env-file .env.nas logs -f backend
docker compose -f docker-compose.nas.yml --env-file .env.nas logs -f cloudflared
```

## 8. Vytvoření správce

Pokud bude potřeba vytvořit superuživatele:

```bash
docker compose -f docker-compose.nas.yml --env-file .env.nas exec backend python manage.py createsuperuser
```

Pokud chceš načíst demo přístupy:

```bash
docker compose -f docker-compose.nas.yml --env-file .env.nas exec backend python manage.py nacist_demo_pristup
```

## 9. Aktualizace při dalším vývoji

Po nahrání nové verze:

```bash
cd /volume1/docker/kliknilistek
docker compose -f docker-compose.nas.yml --env-file .env.nas build
docker compose -f docker-compose.nas.yml --env-file .env.nas up -d
```

## Poznámky

- To, co teď připravujeme, beru jako první veřejný staging.
- Cloudflare Tunnel řeší veřejný přístup bez otevírání portů na routeru.
- Pro ostré e-maily nech `DJANGO_EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend` a doplň SMTP proměnné.
- Pokud chceš staging bez reálného odesílání, přepni `DJANGO_EMAIL_BACKEND` zpět na `django.core.mail.backends.filebased.EmailBackend`.
- Demo přístupy drž zapnuté jen při testování. Pro veřejný provoz nech `NEXT_PUBLIC_DEMO_REZIM=0`.
