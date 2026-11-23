import type { Metadata } from "next";
import { BusinessProfileClient } from "./BusinessProfileClient";

type PageProps = {
  params: Promise<{ slug: string }>;
};

interface FirestoreValue {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
}

interface FirestoreDocument {
  name: string;
  fields?: Record<string, FirestoreValue>;
}

interface BusinessSeoData {
  name: string;
  subcategory: string;
  description: string;
  neighborhood: string;
  address: string;
  showcaseUrl: string;
  logoUrl: string;
  coverUrl: string;
  isApproved: boolean;
}

const SITE_URL = "https://caldasnovasonline.com.br";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

function extractFields(doc?: FirestoreDocument): BusinessSeoData | null {
  if (!doc?.fields) return null;
  const f = doc.fields;

  return {
    name: f.name?.stringValue || "",
    subcategory: f.subcategory?.stringValue || "",
    description: f.description?.stringValue || "",
    neighborhood: f.neighborhood?.stringValue || "",
    address: f.address?.stringValue || "",
    showcaseUrl: f.showcaseUrl?.stringValue || "",
    logoUrl: f.logoUrl?.stringValue || "",
    coverUrl: f.coverUrl?.stringValue || "",
    isApproved: f.isApproved?.booleanValue !== false,
  };
}

function optimizeSocialImage(url: string): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace(
      "/upload/",
      "/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto:good/"
    );
  }
  return url;
}

async function fetchBusinessForMetadata(
  slug: string
): Promise<BusinessSeoData | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !slug) return null;

  const keyParam = apiKey ? `?key=${encodeURIComponent(apiKey)}` : "";

  try {
    // 1. Tentativa direta pelo ID do documento (slug)
    const directUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/businesses/${encodeURIComponent(
      slug
    )}${keyParam}`;

    const directRes = await fetch(directUrl, {
      next: { revalidate: 60 },
    });

    if (directRes.ok) {
      const docData = (await directRes.json()) as FirestoreDocument;
      const parsed = extractFields(docData);
      if (parsed?.name) return parsed;
    }

    // 2. Fallback: consulta estruturada onde slug == params.slug
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery${keyParam}`;

    const queryRes = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "businesses" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "slug" },
              op: "EQUAL",
              value: { stringValue: slug },
            },
          },
          limit: 1,
        },
      }),
      next: { revalidate: 60 },
    });

    if (queryRes.ok) {
      const results = (await queryRes.json()) as Array<{
        document?: FirestoreDocument;
      }>;
      const firstDoc = results?.[0]?.document;
      const parsed = extractFields(firstDoc);
      if (parsed?.name) return parsed;
    }
  } catch (err) {
    console.error("Erro ao gerar metadata dinâmica da empresa:", err);
  }

  return null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const biz = await fetchBusinessForMetadata(slug);

  if (!biz || !biz.name) {
    return {
      title: "Empresa | Caldas Novas Online",
      description:
        "Guia comercial completo de Caldas Novas - GO. Encontre telefones, WhatsApp, endereços e cupons de desconto.",
    };
  }

  const locationLabel = biz.neighborhood
    ? `${biz.neighborhood}, Caldas Novas - GO`
    : "Caldas Novas - GO";

  const title = biz.subcategory
    ? `${biz.name} • ${biz.subcategory} em Caldas Novas - GO`
    : `${biz.name} em Caldas Novas - GO | Caldas Novas Online`;

  const rawDesc = biz.description.replace(/\s+/g, " ").trim();
  const baseDesc = rawDesc
    ? rawDesc.slice(0, 145)
    : `Confira contatos, WhatsApp, localização e ofertas de ${biz.name} em ${locationLabel}.`;

  const description =
    baseDesc.length >= 145
      ? `${baseDesc}... (${locationLabel})`
      : `${baseDesc} • ${locationLabel}`;

  const chosenImage = biz.showcaseUrl || biz.logoUrl || biz.coverUrl;
  const socialImageUrl = chosenImage
    ? optimizeSocialImage(chosenImage)
    : DEFAULT_OG_IMAGE;

  const pageUrl = `${SITE_URL}/empresa/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots: biz.isApproved
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Caldas Novas Online",
      url: pageUrl,
      title,
      description,
      images: [
        {
          url: socialImageUrl,
          width: 1200,
          height: 630,
          alt: `${biz.name} - Caldas Novas Online`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImageUrl],
    },
  };
}

export default async function BusinessPublicPage({ params }: PageProps) {
  const { slug } = await params;
  return <BusinessProfileClient initialSlug={slug} />;
}
