import type { Metadata } from "next";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Business } from "@/types";
import { BusinessProfileClient } from "./BusinessProfileClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const SITE_URL = "https://caldasnovasonline.com.br";
const DEFAULT_OG_IMAGE =
  "https://ldsite.com.br/wp-content/uploads/2026/11/logo-site.jpg";

function optimizeSocialImage(url?: string): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace(
      "/upload/",
      "/upload/c_fill,g_auto,w_1200,h_630,f_jpg,q_auto:good/"
    );
  }
  return url;
}

async function getBusinessBySlug(slug: string): Promise<Business | null> {
  if (!slug) return null;

  try {
    // 1. Busca direta pelo ID do documento (slug)
    const directSnap = await getDoc(doc(db, "businesses", slug));
    if (directSnap.exists()) {
      return {
        ...(directSnap.data() as Omit<Business, "id">),
        id: directSnap.id,
      };
    }

    // 2. Fallback: busca pelo campo slug
    const q = query(
      collection(db, "businesses"),
      where("slug", "==", slug),
      limit(1)
    );
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      const first = qSnap.docs[0];
      return {
        ...(first.data() as Omit<Business, "id">),
        id: first.id,
      };
    }
  } catch (err) {
    console.error("Erro ao buscar empresa para SEO:", err);
  }

  return null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const biz = await getBusinessBySlug(slug);

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
