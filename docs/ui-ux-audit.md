# UI/UX audit KlikniListek

Datum: 24. dubna 2026

## Co jsme řešili

Projekt už má silné provozní jádro, ale správa začala bobtnat a veřejná část místy působila spíš jako technické demo než jako důvěryhodný kulturní portál. Audit proto šel ve třech vrstvách:

1. Informační architektura správy
2. Hierarchie a srozumitelnost veřejného prodeje
3. Jazyková konzistence včetně české diakritiky

## Hlavní zjištění

### Správa

- Bylo těžké rychle pochopit, kde končí „provoz“, kde začíná „program“ a kde jsou „finance“.
- Dlouhý sled formulářů a tabulek zvyšoval mentální zátěž.
- Klíčové pracovní oblasti byly přítomné, ale nebyly seskupené do jednoznačných celků.

### Veřejný frontend

- Návštěvník dostal důležité informace, ale hero i katalog potřebovaly silnější důvěryhodnost a čitelnější tok k objednávce.
- Texty bez diakritiky působily nedotaženě a snižovaly profesionální dojem.
- CTA a obsah stránky byly správné, ale ne vždy dostatečně jasně seřazené podle priority.

## Nové uspořádání správy

Správu jsme rozdělili do jasných bloků:

- Přehled
- Výkonnost akcí
- Provoz a tým
- Místa a plánky
- Program a prodej
- Objednávky a finance

Tím vznikla logika:

- nejdřív situace
- potom provozní práce
- pak obsah a prodej
- nakonec finance

To odpovídá běžnému chování obsluhy: člověk nejdřív zkontroluje stav, potom řeší konkrétní úkol.

## Zásady pro další pokračování

### Správa

- Jedna obrazovka má mít jeden dominantní účel.
- Sekce mají odpovídat reálné práci lidí, ne struktuře databáze.
- Detail akce, detail objednávky a builder plánků jsou správně jako hlubší pracovní vrstvy.
- Tabulky musí vždy nabízet rychlý přechod do detailu.

### Veřejný portál

- Hero má být důvěryhodný a okamžitě vysvětlit, že jde o oficiální místo pro objednání vstupenek.
- Katalog má být snadno skenovatelný: termín, místo, cena, CTA.
- Detail akce má vést rovnou k objednávce bez zbytečných odboček.

### Jazyk

- Všechny viditelné texty mají být v přirozené češtině s diakritikou.
- Tone of voice má být civilní, srozumitelný a důvěryhodný.

## Referenční principy

Při úpravách jsme se opírali o aktuální principy z moderních produktových systémů:

- task-based information architecture
- jasné oddělení navigace, přehledu a pracovních detailů
- vysoká čitelnost datových obrazovek
- konzistentní CTA a hierarchie obsahu

Orientační zdroje:

- Material Design: [https://m3.material.io/](https://m3.material.io/)
- Shopify Polaris: [https://polaris.shopify.com/](https://polaris.shopify.com/)
- Nielsen Norman Group: [https://www.nngroup.com/](https://www.nngroup.com/)

## Co doporučuju dál

1. Projít všechny detailní obrazovky a sjednotit diakritiku i tam, kde se text skládá z menších komponent.
2. Udělat druhé kolo nad builderem a detailními provozními obrazovkami po reálném používání.
3. Zavést jednotný textový styl pro hlášky, stavy a systémové akce.
4. Až bude logo a značka, navázat samostatným brand systémem nad už stabilní informační architekturou.
