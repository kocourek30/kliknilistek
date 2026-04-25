import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

type Vlastnosti = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StrankaDetailuUzivateleSpravy({ params }: Vlastnosti) {
  const { id } = await params;
  return <SpravaSekceBrana sekce="uzivatel-detail" parametr={id} />;
}
