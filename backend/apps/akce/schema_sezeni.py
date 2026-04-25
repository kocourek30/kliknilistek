from unicodedata import normalize


def vytvor_schema_kinosal_dolni_kralovice():
    rady = [
        {
            "rada": 1,
            "levy_pristavek": [1, 2],
            "stred": list(range(1, 18)),
            "pravy_pristavek": [11, 12],
            "zona_levy": "pristavek_predni",
            "zona_pravy": "pristavek_predni",
            "odsazeni_stred": 0,
        },
        {
            "rada": 2,
            "levy_pristavek": [3, 4],
            "stred": list(range(1, 18)),
            "pravy_pristavek": [13, 14],
            "zona_levy": "pristavek_predni",
            "zona_pravy": "pristavek_predni",
            "odsazeni_stred": 0,
        },
        {
            "rada": 3,
            "levy_pristavek": [5, 6],
            "stred": list(range(1, 18)),
            "pravy_pristavek": [15, 16],
            "zona_levy": "pristavek_predni",
            "zona_pravy": "pristavek_predni",
            "odsazeni_stred": 0,
        },
        {
            "rada": 4,
            "levy_pristavek": [7, 8],
            "stred": list(range(1, 18)),
            "pravy_pristavek": [17, 18],
            "zona_levy": "pristavek_predni",
            "zona_pravy": "pristavek_predni",
            "odsazeni_stred": 0,
        },
        {
            "rada": 5,
            "levy_pristavek": [9, 10],
            "stred": list(range(1, 18)),
            "pravy_pristavek": [19, 20, 21],
            "zona_levy": "pristavek_predni",
            "zona_pravy": "pristavek_predni",
            "odsazeni_stred": 0,
        },
        {
            "rada": 6,
            "levy_pristavek": [22, 23],
            "stred": list(range(1, 18)),
            "pravy_pristavek": [31, 32],
            "zona_levy": "pristavek_zadni",
            "zona_pravy": "pristavek_zadni",
            "odsazeni_stred": 0,
        },
        {
            "rada": 7,
            "levy_pristavek": [24, 25],
            "stred": list(range(1, 17)),
            "pravy_pristavek": [33, 34],
            "zona_levy": "pristavek_zadni",
            "zona_pravy": "pristavek_zadni",
            "odsazeni_stred": 0,
        },
        {
            "rada": 8,
            "levy_pristavek": [26, 27],
            "stred": list(range(1, 14)),
            "pravy_pristavek": [35],
            "zona_levy": "pristavek_zadni",
            "zona_pravy": "pristavek_zadni",
            "odsazeni_stred": 2,
        },
        {
            "rada": 9,
            "levy_pristavek": [28, 29],
            "stred": list(range(1, 13)),
            "pravy_pristavek": [36, 37],
            "zona_levy": "pristavek_zadni",
            "zona_pravy": "pristavek_zadni",
            "odsazeni_stred": 3,
        },
        {
            "rada": 10,
            "levy_pristavek": [30],
            "stred": list(range(1, 14)),
            "pravy_pristavek": [38, 39],
            "zona_levy": "pristavek_zadni",
            "zona_pravy": "pristavek_zadni",
            "odsazeni_stred": 2,
        },
        {
            "rada": 11,
            "levy_pristavek": [],
            "stred": list(range(1, 15)),
            "pravy_pristavek": [40],
            "zona_levy": "pristavek_zadni",
            "zona_pravy": "pristavek_zadni",
            "odsazeni_stred": 2,
        },
    ]

    return {
        "typ": "kinosal_dolni_kralovice",
        "nazev": "Kinosal Dolni Kralovice",
        "popis": "Mistenkovy vyber sedadel pro kino v Dolnich Kralovicich.",
        "sloupce_stred": 17,
        "sloupce_levy_pristavek": 2,
        "sloupce_pravy_pristavek": 3,
        "stit": "Jeviste",
        "rady": rady,
    }


def vytvor_schema_spolecensky_sal_dolni_kralovice():
    parket = [list(range(start, start + 6)) for start in range(1, 133, 6)]
    prizemi = [
        list(range(133, 139)),
        list(range(139, 145)),
        [145, 146],
        [147, 148],
        list(range(149, 155)),
        list(range(155, 161)),
        list(range(161, 167)),
        list(range(167, 173)),
        [173, 174],
        [175, 176],
        list(range(177, 183)),
        list(range(183, 189)),
        list(range(189, 195)),
        list(range(195, 201)),
        [201, 202],
        [203, 204],
        list(range(205, 211)),
        list(range(211, 217)),
        list(range(217, 223)),
        list(range(223, 229)),
        [229, 230],
        [231, 232],
    ]
    balkon = [
        [],
        [],
        [233, 234],
        [235, 236],
        [237, 238, 239, 240],
        [241, 242, 243, 244],
        [245, 246, 247, 248],
        [249, 250, 251, 252],
        [253, 254],
        [255, 256],
        [257, 258, 259, 260],
        [261, 262, 263, 264],
        [265, 266, 267, 268],
        [269, 270, 271, 272],
        [273, 274],
        [275, 276],
        [277, 278, 279, 280],
        [281, 282, 283, 284],
        [285, 286, 287, 288],
        [289, 290, 291, 292],
        [293, 294],
        [295, 296],
    ]
    balkon_bok = [
        [347, 348, 349, 350, 351],
        [352, 353, 354, 355, 356],
        [337, 338, 339, 340, 341],
        [342, 343, 344, 345, 346],
        [327, 328, 329, 330, 331],
        [332, 333, 334, 335, 336],
        [317, 318, 319, 320, 321],
        [322, 323, 324, 325, 326],
        [307, 308, 309, 310, 311],
        [312, 313, 314, 315, 316],
        [297, 298, 299, 300, 301],
        [302, 303, 304, 305, 306],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
    ]

    rady = []
    for index in range(22):
        useky = [
            {
                "id": "parket",
                "nazev": "Parket",
                "zona": "parket",
                "kod_prefix": "M",
                "mista": parket[index],
            }
        ]
        if prizemi[index]:
            useky.append(
                {
                    "id": "prizemi",
                    "nazev": "Prizemi",
                    "zona": "prizemi",
                    "kod_prefix": "M",
                    "mista": prizemi[index],
                }
            )
        if balkon[index]:
            useky.append(
                {
                    "id": "balkon",
                    "nazev": "Balkon",
                    "zona": "balkon",
                    "kod_prefix": "M",
                    "mista": balkon[index],
                }
            )
        if balkon_bok[index]:
            useky.append(
                {
                    "id": "balkon_bok",
                    "nazev": "Balkon bok",
                    "zona": "balkon_bok",
                    "kod_prefix": "M",
                    "mista": balkon_bok[index],
                }
            )
        rady.append(
            {
                "rada": index + 1,
                "popisek": index + 1,
                "useky": useky,
            }
        )

    return {
        "typ": "spolecensky_sal_dolni_kralovice",
        "nazev": "Spolecensky sal Dolni Kralovice",
        "popis": "Presne rozlozeni mist podle planu spolecenskeho salu v Dolnich Kralovicich.",
        "stit": "JEVISTE",
        "rady": rady,
    }


def iteruj_mista_schema(schema):
    if schema.get("podlazi"):
        for podlazi in schema.get("podlazi", []):
            for misto in iteruj_mista_schema(
                {
                    "mrizka": podlazi.get("mrizka") or {},
                    "rady": podlazi.get("rady") or [],
                }
            ):
                if podlazi.get("nazev"):
                    misto["popis"] = f"{misto['popis']} · {podlazi['nazev']}"
                yield misto
        return

    mrizka = schema.get("mrizka") or {}
    if mrizka:
        for bunka in mrizka.get("bunky", []):
            if bunka.get("typ") not in ["sedadlo", "stul"]:
                continue
            kod = bunka.get("kod")
            if not kod:
                continue
            yield {
                "kod": kod,
                "popis": bunka.get("popis") or bunka.get("oznaceni") or kod,
                "rada": bunka.get("radek"),
                "blok": bunka.get("typ", ""),
                "zona": bunka.get("zona") or bunka.get("vazba_stul") or bunka.get("typ", ""),
                "cislo": bunka.get("oznaceni") or bunka.get("sloupec"),
            }
        return

    for rada in schema.get("rady", []):
        oznaceni_rady = rada.get("popisek", rada.get("rada"))
        useky = rada.get("useky") or []
        if useky:
            for usek in useky:
                kod_prefix = usek.get("kod_prefix", "M")
                nazev_useku = usek.get("nazev", "Misto")
                for cislo in usek.get("mista", []):
                    yield {
                        "kod": f"{kod_prefix}{cislo}",
                        "popis": f"Misto {cislo} · {nazev_useku}",
                        "rada": oznaceni_rady,
                        "blok": usek.get("id", ""),
                        "zona": usek.get("zona", ""),
                        "cislo": cislo,
                    }
            continue

        cislo_rady = rada.get("rada")
        for cislo in rada.get("levy_pristavek", []):
            yield {
                "kod": f"R{cislo_rady}-L{cislo}",
                "popis": f"Rada {cislo_rady}, pristavek vlevo {cislo}",
                "rada": cislo_rady,
                "blok": "levy_pristavek",
                "zona": rada.get("zona_levy", ""),
                "cislo": cislo,
            }
        for cislo in rada.get("stred", []):
            yield {
                "kod": f"R{cislo_rady}-S{cislo}",
                "popis": f"Rada {cislo_rady}, sedadlo {cislo}",
                "rada": cislo_rady,
                "blok": "stred",
                "zona": "stred",
                "cislo": cislo,
            }
        for cislo in rada.get("pravy_pristavek", []):
            yield {
                "kod": f"R{cislo_rady}-P{cislo}",
                "popis": f"Rada {cislo_rady}, pristavek vpravo {cislo}",
                "rada": cislo_rady,
                "blok": "pravy_pristavek",
                "zona": rada.get("zona_pravy", ""),
                "cislo": cislo,
            }


def normalizuj_text(text):
    text = normalize("NFKD", text or "")
    return "".join(znak for znak in text.lower() if ord(znak) < 128)


def ziskej_schema_sezeni_pro_misto(misto_konani):
    schema = getattr(misto_konani, "schema_sezeni", None) or {}
    if schema:
        return schema

    nazev = normalizuj_text(getattr(misto_konani, "nazev", ""))
    mesto = normalizuj_text(getattr(misto_konani, "mesto", ""))

    if "dolni kralovice" in mesto or "dolni kralovice" in nazev:
        if "kino" in nazev or "kinosal" in nazev:
            return vytvor_schema_kinosal_dolni_kralovice()
        if "kulturni dum" in nazev or "spolecensky sal" in nazev or "spolecensky" in nazev:
            return vytvor_schema_spolecensky_sal_dolni_kralovice()

    return {}


def ziskej_schema_sezeni_pro_akci(akce):
    schema_override = getattr(akce, "schema_sezeni_override", None) or {}
    if schema_override:
        return schema_override
    return ziskej_schema_sezeni_pro_misto(akce.misto_konani)
