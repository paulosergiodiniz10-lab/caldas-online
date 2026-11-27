import type { Metadata } from "next";
import { BusinessProfileClient } from "./BusinessProfileClient";
import { getPublicBusinessBySlug, getPublicSettings } from "@/lib/publicData";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = "https://caldasnovasonline.com.br";
const DEFAULT_OG_IMAGE =
  "https://ldsite.com.br/wp-content/uploads/2026/11/logo-site.jpg";

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const biz = await getPublicBusinessBySlug(slug);

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

  const locationLabel =
    biz.showAddressOnSite !== false && biz.neighborhood
      ? `${biz.neighborhood}, Caldas Novas - GO`
      : "Caldas Novas - GO";

  const title = biz.subcategory
    ? `${biz.name} • ${biz.subcategory} em Caldas Novas - GO`
    : `${biz.name} em Caldas Novas - GO`;

  const rawDesc = (biz.description || "").replace(/\s+/g, " ").trim();
  const baseDesc = rawDesc
    ? rawDesc.slice(0, 145)
    : `Confira contatos, WhatsApp e ofertas de ${biz.name} em ${locationLabel}.`;

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
    robots:
      biz.isApproved !== false
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

function buildLocalBusinessJsonLd(
  slug: string,
  biz: NonNullable<Awaited<ReturnType<typeof getPublicBusinessBySlug>>>
) {
  const pageUrl = `${SITE_URL}/empresa/${slug}`;
  const cleanPhone = (biz.whatsapp || "").replace(/\D/g, "");
  const formattedPhone = cleanPhone
    ? cleanPhone.startsWith("55")
      ? `+${cleanPhone}`
      : `+55${cleanPhone}`
    : undefined;

  const images = [biz.showcaseUrl, biz.logoUrl, biz.coverUrl].filter(
    (u): u is string => Boolean(u)
  );

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
      (biz.description || "").replace(/\s+/g, " ").trim() ||
      `${biz.name} em Caldas Novas - GO`,
    image: images.length > 0 ? images : [DEFAULT_OG_IMAGE],
    address:
      biz.showAddressOnSite !== false
        ? {
            "@type": "PostalAddress",
            streetAddress: [biz.address, biz.neighborhood]
              .filter(Boolean)
              .join(" - "),
            addressLocality: "Caldas Novas",
            addressRegion: "GO",
            postalCode: biz.cep || undefined,
            addressCountry: "BR",
          }
        : {
            "@type": "PostalAddress",
            addressLocality: "Caldas Novas",
            addressRegion: "GO",
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
  if (
    biz.showAddressOnSite !== false &&
    typeof biz.lat === "number" &&
    typeof biz.lng === "number"
  ) {
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

  const [biz, settings] = await Promise.all([
    getPublicBusinessBySlug(slug),
    getPublicSettings(),
  ]);

  const jsonLd =
    biz && biz.name && biz.isApproved !== false
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
      <BusinessProfileClient
        initialSlug={slug}
        initialBusiness={biz}
        initialSettings={settings}
      />
    </>
  );
}
