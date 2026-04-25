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
    return <div className="tlumeny">Doruceni vstupenek se odemkne po zaplaceni objednavky.</div>;
  }

  return (
    <div className="stack">
      {chyba ? <div className="hlaseni chyba">{chyba}</div> : null}
      {jeDoruceno ? (
        <div className="hlaseni uspech">Vstupenky uz byly oznaceny jako dorucene.</div>
      ) : (
        <div className="panel-akce">
          <button className="button primary" disabled={odesilaSe} onClick={spustDoruceni} type="button">
            {odesilaSe ? "Pripravuji doruceni..." : "Odeslat vstupenky zakaznikovi"}
          </button>
        </div>
      )}
    </div>
  );
}
