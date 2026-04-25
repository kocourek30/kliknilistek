"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { dorucVstupenkyObjednavky } from "@/lib/api";

type DoruceniKlientProps = {
  verejneId: string;
  jeZaplaceno: boolean;
  jeDoruceno: boolean;
};

export function DoruceniKlient({ verejneId, jeZaplaceno, jeDoruceno }: DoruceniKlientProps) {
  const router = useRouter();
  const [odesilaSe, setOdesilaSe] = useState(false);
  const [chyba, setChyba] = useState("");

  async function spustDoruceni() {
    setOdesilaSe(true);
    setChyba("");

    try {
      await dorucVstupenkyObjednavky(verejneId);
      router.refresh();
    } catch (error) {
      setChyba(error instanceof Error ? error.message : "Doruceni se nepodarilo spustit.");
    } finally {
      setOdesilaSe(false);
    }
  }

  if (!jeZaplaceno) {
    return <div className="inline-note">Doručení vstupenek se odemkne po zaplacení objednávky.</div>;
  }

  return (
    <div className="stack">
      {chyba ? <div className="public-alert public-alert-error">{chyba}</div> : null}
      {jeDoruceno ? (
        <div className="public-alert public-alert-success">Vstupenky už byly označeny jako doručené.</div>
      ) : (
        <div className="panel-akce">
          <button className="kulturni-button kulturni-button-primary" disabled={odesilaSe} onClick={spustDoruceni} type="button">
            {odesilaSe ? "Připravuji doručení..." : "Odeslat vstupenky zákazníkovi"}
          </button>
        </div>
      )}
    </div>
  );
}
