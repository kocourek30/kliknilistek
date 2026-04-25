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
    return <div className="public-alert public-alert-success">Objednávka je zaplacená a vstupenky jsou platné.</div>;
  }

  if (!rezervaceAktivni) {
    return <div className="public-alert public-alert-error">Rezervace už vypršela, proto už nejde pokračovat v platbě.</div>;
  }

  if (zpusobUhrady === "bankovni_prevod") {
    return (
      <div className="public-alert public-alert-success">
        Objednávka čeká na bankovní převod podle vystavené proformy. Po přijetí platby budou
        vstupenky automaticky doručeny e-mailem.
      </div>
    );
  }

  return (
    <div className="stack">
      {chyba ? <div className="public-alert public-alert-error">{chyba}</div> : null}
      <div className="panel-akce">
        <button className="kulturni-button kulturni-button-primary" disabled={odesilaSe} onClick={spustSimulaci} type="button">
          {odesilaSe ? "Potvrzuji platbu..." : "Simulovat zaplacení objednávky"}
        </button>
      </div>
    </div>
  );
}
