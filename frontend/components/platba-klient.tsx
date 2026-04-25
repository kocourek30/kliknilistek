"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { simulujPlatbu } from "@/lib/api";

type PlatbaKlientProps = {
  verejneId: string;
  rezervaceAktivni: boolean;
  jeZaplaceno: boolean;
  zpusobUhrady?: string;
};

export function PlatbaKlient({
  verejneId,
  rezervaceAktivni,
  jeZaplaceno,
  zpusobUhrady,
}: PlatbaKlientProps) {
  const router = useRouter();
  const [odesilaSe, setOdesilaSe] = useState(false);
  const [chyba, setChyba] = useState("");

  async function spustSimulaci() {
    setOdesilaSe(true);
    setChyba("");

    try {
      await simulujPlatbu(verejneId, "stripe");
      router.refresh();
    } catch (error) {
      setChyba(error instanceof Error ? error.message : "Platbu se nepodarilo potvrdit.");
    } finally {
      setOdesilaSe(false);
    }
  }

  if (jeZaplaceno) {
    return <div className="hlaseni uspech">Objednavka uz je zaplacena a vstupenky jsou platne.</div>;
  }

  if (!rezervaceAktivni) {
    return <div className="hlaseni chyba">Rezervace uz vyprsela, proto uz nejde simulovat platbu.</div>;
  }

  if (zpusobUhrady === "bankovni_prevod") {
    return (
      <div className="hlaseni uspech">
        Objednávka čeká na bankovní převod podle vystavené proformy. Po přijetí platby budou
        vstupenky automaticky doručeny e-mailem.
      </div>
    );
  }

  return (
    <div className="stack">
      {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}
      <div className="panel-akce">
        <button className="button primary" disabled={odesilaSe} onClick={spustSimulaci} type="button">
          {odesilaSe ? "Potvrzuji platbu..." : "Simulovat zaplaceni objednavky"}
        </button>
      </div>
    </div>
  );
}
