import { SpravaDetailObjednavkyBrana } from "@/components/sprava-detail-objednavky-brana";

type Vlastnosti = {
  params: Promise<{
    verejneId: string;
  }>;
};

export default async function StrankaDetailuObjednavkySpravy({ params }: Vlastnosti) {
  const { verejneId } = await params;

  return <SpravaDetailObjednavkyBrana verejneId={verejneId} />;
}
