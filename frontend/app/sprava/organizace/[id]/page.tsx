import { SpravaSekceBrana } from "@/components/sprava-sekce-brana";

type Vlastnosti = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StrankaDetailuOrganizaceSpravy({ params }: Vlastnosti) {
  const { id } = await params;
  return <SpravaSekceBrana sekce="organizace-detail" parametr={id} />;
}
