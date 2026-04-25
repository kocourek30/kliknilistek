import { headers } from "next/headers";

export async function nactiAktualniHost(): Promise<string> {
  const hlavicky = await headers();
  return hlavicky.get("x-forwarded-host") ?? hlavicky.get("host") ?? "";
}
