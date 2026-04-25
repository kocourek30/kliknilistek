import { SpravaDetailAkceBrana } from "@/components/sprava-detail-akce-brana";

type Vlastnosti = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function StrankaDetailuAkceSpravy({ params }: Vlastnosti) {
  const { slug } = await params;

  return <SpravaDetailAkceBrana slug={slug} />;
}
