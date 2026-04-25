# Technicky navrh MVP

## Cile prvni verze

Prvni releas musi bez kompromisu zvladnout:

1. zalozeni prostoru organizace pro obec nebo kulturni dum
2. vytvoreni akce a kategorii vstupenek
3. online objednavku s navazanim na platebni branu
4. generovani a distribuci QR vstupenek
5. odbaveni pres mobilni rozhrani
6. financni a provozni prehled pro poradatelsky tym

## Architektura

- Frontend: Next.js App Router, TypeScript
- Backend: Django + Django REST Framework
- Databaze: PostgreSQL
- Cache a queue: Redis
- Async jobs: Celery
- Storage: S3 kompatibilni object storage

## Domény

### Uzivatele a role
- prihlaseni
- role
- clenstvi v organizaci
- audit pristupu

### Organizace
- obec nebo kulturni instituce
- branding
- nastaveni prodeje a plateb

### Akce
- akce
- termin
- misto
- kapacita
- publikace

### Objednavky
- kosik
- objednavka
- objednavkove polozky
- rezervace kapacity

### Platby
- zalozena platba
- webhooky
- parovani
- refundace

### Vstupenky
- vygenerovane listky
- QR token
- stavy vstupenek

### Odbaveni
- validace QR
- ochrana proti dvojitemu vstupu
- log odbaveni

### Prehledy
- trzby
- prodane listky
- navstevnost
- exporty

## Princip vice organizaci

Jedna aplikace, jedna databaze, konzistentni izolace organizaci pres `organizace_id`.

Zakladni pravidla:

- kazdy zapis patri organizaci
- kazdy dotaz se filtruje organizaci
- role se vyhodnocuji v kontextu clenstvi v organizaci
- globalni admin prava jsou oddelena od role v organizaci

## Datovy model MVP

- `Organizace`
- `ClenstviOrganizace`
- `Uzivatel`
- `MistoKonani`
- `Akce`
- `KategorieVstupenky`
- `Objednavka`
- `PolozkaObjednavky`
- `Platba`
- `Vstupenka`
- `Odbaveni`
- `AuditniZaznam`

## API oblasti

- `/api/autentizace/*`
- `/api/organizace/*`
- `/api/akce/*`
- `/api/objednavky/*`
- `/api/platby/*`
- `/api/vstupenky/*`
- `/api/odbaveni/*`
- `/api/prehledy/*`

## Roadmapa

### Faze 1
- projektova kostra
- model organizaci
- prihlaseni a role
- sprava akci

### Faze 2
- tok objednavky
- platebni callbacky
- generovani QR vstupenek
- e-mail distribuce

### Faze 3
- aplikace pro odbaveni
- prehledovy panel
- exporty

### Faze 4
- mistenkovy prodej
- pokladni rezim
- vlastni vzhled pro obce
