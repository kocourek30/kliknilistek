import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

type Vlastnosti = {
  params: Promise<{
    kod: string;
  }>;
};

export default async function StrankaDetailuVstupenkySpravy({ params }: Vlastnosti) {
  const { kod } = await params;
  return <SpravaSekceBrana sekce="vstupenka-detail" parametr={kod} />;
}
