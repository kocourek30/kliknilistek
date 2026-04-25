# KlikniListek

KlikniListek je SaaS platforma pro obce, kulturni domy a lokalni poradatelske tymy, ktera zjednodusuje prodej vstupenek, distribuci QR listku, odbaveni u vstupu a financni prehledy.

Tento repozitar je zalozeny jako monorepo pro:

- `backend/` - Django API a aplikační logiku
- `frontend/` - Next.js aplikaci pro verejny web, administraci a odbaveni
- `docs/` - technicky navrh a produktove podklady

## Priorita prvni iterace

Prvni iterace stavi zaklad pro:

- model vice organizaci v jedne aplikaci
- akce a kategorie vstupenek
- objednavku a platebni tok
- QR listky a odbaveni
- zakladni prehledy

## Dalsi krok

1. Dopsat datovy model a API kontrakty.
2. Rozbehnout Docker vyvojove prostredi.
3. Implementovat prvni end-to-end tok:
   vytvoreni akce -> objednavka -> potvrzena platba -> vygenerovana vstupenka -> odbaveni.
