import { SpravaDetailMistaBrana } from "@/components/sprava-detail-mista-brana";

type Vlastnosti = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StrankaDetailuMistaSpravy({ params }: Vlastnosti) {
  const { id } = await params;

  return <SpravaDetailMistaBrana idMista={id} />;
}
