import { NextRequest, NextResponse } from "next/server";

const backendApi =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.KLIKNILISTEK_API_URL ?? "http://127.0.0.1:8001/api";

function vytvorCilovouUrl(request: NextRequest, cesta: string[]) {
  const cil = new URL(`${backendApi.replace(/\/$/, "")}/${cesta.join("/")}/`);
  request.nextUrl.searchParams.forEach((hodnota, klic) => {
    cil.searchParams.append(klic, hodnota);
  });
  return cil;
}

async function preposliNaBackend(request: NextRequest, context: { params: Promise<{ cesta: string[] }> }) {
  const { cesta } = await context.params;
  const cilovaUrl = vytvorCilovouUrl(request, cesta);
  const maTelo = !["GET", "HEAD"].includes(request.method);
  const obsahTyp = request.headers.get("content-type") ?? "";
  const jeMultipart = obsahTyp.includes("multipart/form-data");

  try {
    const odpoved = await fetch(cilovaUrl, {
      method: request.method,
      headers: {
        Accept: request.headers.get("accept") ?? "application/json",
        ...(request.headers.get("host")
          ? {
              "X-Tenant-Host": request.headers.get("host") as string,
            }
          : {}),
        ...((request.headers.get("x-sprava-token") ?? request.headers.get("authorization"))
          ? {
              Authorization: (request.headers.get("x-sprava-token") ??
                request.headers.get("authorization")) as string,
            }
          : {}),
        ...(request.headers.get("content-type") && !jeMultipart
          ? { "Content-Type": request.headers.get("content-type") as string }
          : {}),
      },
      body: maTelo ? (jeMultipart ? await request.formData() : await request.text()) : undefined,
      cache: "no-store",
    });

    const telo = await odpoved.arrayBuffer();

    return new NextResponse(telo, {
      status: odpoved.status,
      headers: {
        "Content-Type": odpoved.headers.get("content-type") ?? "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(odpoved.headers.get("content-disposition")
          ? { "Content-Disposition": odpoved.headers.get("content-disposition") as string }
          : {}),
      },
    });
  } catch {
    return NextResponse.json(
      {
        detail: "Backend správy je dočasně nedostupný. Obnov stránku nebo to zkus znovu za chvíli.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ cesta: string[] }> }) {
  return preposliNaBackend(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ cesta: string[] }> }) {
  return preposliNaBackend(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ cesta: string[] }> }) {
  return preposliNaBackend(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ cesta: string[] }> }) {
  return preposliNaBackend(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ cesta: string[] }> }) {
  return preposliNaBackend(request, context);
}
