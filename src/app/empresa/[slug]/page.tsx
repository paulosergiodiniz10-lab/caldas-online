import type { Metadata } from "next";
import { BusinessProfileClient } from "./BusinessProfileClient";

export const dynamic = "force-dynamic";

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
  cep: string;
  whatsapp: string;
  instagram: string;
  website: string;
  lat: number | null;
  lng: number | null;
  showcaseUrl: string;
  logoUrl: string;
  coverUrl: string;
  isApproved: boolean;
}

const SITE_URL = "https://caldasnovasonline.com.br";
const DEFAULT_OG_IMAGE =
  "https://ldsite.com.br/wp-content/uploads/2026/11/logo-site.jpg";

function extractNumber(val?: FirestoreValue): number | null {
  if (!val) return null;
  if (typeof val.doubleValue === "number") return val.doubleValue;
  if (val.integerValue) {
    const parsed = Number(val.integerValue);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function extractFields(doc?: FirestoreDocument): BusinessSeoData | null {
  if (!doc?.fields) return null;
  const f = doc.fields;

  return {
    name: f.name?.stringValue || "",
    subcategory: f.subcategory?.stringValue || "",
    description: f.description?.stringValue || "",
    neighborhood: f.neighborhood?.stringValue || "",
    address: f.address?.stringValue || "",
    cep: f.cep?.stringValue || "",
    whatsapp: f.whatsapp?.stringValue || "",
    instagram: f.instagram?.stringValue || "",
    website: f.website?.stringValue || "",
    lat: extractNumber(f.lat),
    lng: extractNumber(f.lng),
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

async function fetchBusinessForSeo(
  slug: string
): Promise<BusinessSeoData | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId || !slug) return null;

  const keyParam = apiKey ? `?key=${encodeURIComponent(apiKey)}` : "";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const directUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/businesses/${encodeURIComponent(
      slug
    )}${keyParam}`;

    const directRes = await fetch(directUrl, {
      cache: "no-store",
      signal: controller.signal,
    });

    if (directRes.ok) {
      const docData = (await directRes.json()) as FirestoreDocument;
      const parsed = extractFields(docData);
      if (parsed?.name) return parsed;
    }

    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery${keyParam}`;

    const queryRes = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: controller.signal,
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
    });

    if (queryRes.ok) {
      const results = (await queryRes.json()) as Array<{
        document?: FirestoreDocument;
      }>;
      const parsed = extractFields(results?.[0]?.document);
      if (parsed?.name) return parsed;
    }
  } catch (err) {
    console.error("Erro ao buscar empresa para WhatsApp/SEO:", err);
  } finally {
    clearTimeout(timeout);
  }

  return null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const biz = await fetchBusinessForSeo(slug);

  if (!biz || !biz.name) {
    return {
      title: "Empresa | Caldas Novas Online",
      description:
        "Guia comercial completo de Caldas Novas - GO. Encontre telefones, WhatsApp, endereços e cupons de desconto.",
      openGraph: {
        type: "website",
        locale: "pt_BR",
        siteName: "Caldas Novas Online",
        url: `${SITE_URL}/empresa/${slug}`,
        title: "Caldas Novas Online | O Guia Comercial de Caldas Novas - GO",
        description:
          "Encontre empresas, hotéis, restaurantes, cupons de desconto exclusivos e utilidades em Caldas Novas - GO.",
        images: [
          {
            url: DEFAULT_OG_IMAGE,
            secureUrl: DEFAULT_OG_IMAGE,
            width: 1200,
            height: 630,
            type: "image/jpeg",
            alt: "Caldas Novas Online",
          },
        ],
      },
    };
  }

  const locationLabel = biz.neighborhood
    ? `${biz.neighborhood}, Caldas Novas - GO`
    : "Caldas Novas - GO";

  const title = biz.subcategory
    ? `${biz.name} • ${biz.subcategory} em Caldas Novas - GO`
    : `${biz.name} em Caldas Novas - GO`;

  const rawDesc = (biz.description || "").replace(/\s+/g, " ").trim();
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
          secureUrl: socialImageUrl,
          width: 1200,
          height: 630,
          type: "image/jpeg",
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

function buildLocalBusinessJsonLd(slug: string, biz: BusinessSeoData) {
  const pageUrl = `${SITE_URL}/empresa/${slug}`;
  const cleanPhone = biz.whatsapp.replace(/\D/g, "");
  const formattedPhone = cleanPhone
    ? cleanPhone.startsWith("55")
      ? `+${cleanPhone}`
      : `+55${cleanPhone}`
    : undefined;

  const images = [biz.showcaseUrl, biz.logoUrl, biz.coverUrl].filter(Boolean);

  const sameAs: string[] = [];
  if (biz.instagram) {
    sameAs.push(
      biz.instagram.startsWith("http")
        ? biz.instagram
        : `https://instagram.com/${biz.instagram.replace("@", "")}`
    );
  }
  if (biz.website) {
    sameAs.push(
      biz.website.startsWith("http") ? biz.website : `https://${biz.website}`
    );
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${pageUrl}#business`,
    name: biz.name,
    url: pageUrl,
    description:
      biz.description.replace(/\s+/g, " ").trim() ||
      `${biz.name} em Caldas Novas - GO`,
    image: images.length > 0 ? images : [DEFAULT_OG_IMAGE],
    address: {
      "@type": "PostalAddress",
      streetAddress: [biz.address, biz.neighborhood]
        .filter(Boolean)
        .join(" - "),
      addressLocality: "Caldas Novas",
      addressRegion: "GO",
      postalCode: biz.cep || undefined,
      addressCountry: "BR",
    },
    areaServed: {
      "@type": "City",
      name: "Caldas Novas",
    },
  };

  if (biz.logoUrl) {
    jsonLd.logo = biz.logoUrl;
  }
  if (formattedPhone) {
    jsonLd.telephone = formattedPhone;
  }
  if (biz.subcategory) {
    jsonLd.knowsAbout = biz.subcategory;
  }
  if (sameAs.length > 0) {
    jsonLd.sameAs = sameAs;
  }
  if (typeof biz.lat === "number" && typeof biz.lng === "number") {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: biz.lat,
      longitude: biz.lng,
    };
  }

  return jsonLd;
}

export default async function BusinessPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const biz = await fetchBusinessForSeo(slug);

  const jsonLd =
    biz && biz.name && biz.isApproved
      ? buildLocalBusinessJsonLd(slug, biz)
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BusinessProfileClient initialSlug={slug} />
    </>
  );
}
