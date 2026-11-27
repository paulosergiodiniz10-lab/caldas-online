import {
  Business,
  CategoryDoc,
  PromoBanner,
  SiteSettings,
  UtilityDoc,
  BusinessHours,
  DayKey,
} from "@/types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_UTILITIES,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_BUSINESS_HOURS,
} from "@/lib/constants";

type FirestoreValue = {
  stringValue?: string;
  booleanValue?: boolean;
  integerValue?: string;
  doubleValue?: number;
  nullValue?: null;
  arrayValue?: { values?: FirestoreValue[] };
  mapValue?: { fields?: Record<string, FirestoreValue> };
};

interface FirestoreDoc {
  name?: string;
  fields?: Record<string, FirestoreValue>;
}

function parseFirestoreValue(val?: FirestoreValue): unknown {
  if (!val) return undefined;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.integerValue !== undefined) {
    const num = Number(val.integerValue);
    return Number.isFinite(num) ? num : 0;
  }
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue !== undefined) {
    return (val.arrayValue.values || []).map((v) => parseFirestoreValue(v));
  }
  if (val.mapValue !== undefined) {
    const obj: Record<string, unknown> = {};
    const fields = val.mapValue.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      obj[k] = parseFirestoreValue(v);
    }
    return obj;
  }
  return undefined;
}

function docToObject<T>(doc?: FirestoreDoc): (T & { id: string }) | null {
  if (!doc?.fields) return null;
  const id = doc.name ? doc.name.split("/").pop() || "" : "";
  const parsed: Record<string, unknown> = { id };
  for (const [key, val] of Object.entries(doc.fields)) {
    parsed[key] = parseFirestoreValue(val);
  }
  return parsed as T & { id: string };
}

function getFirestoreBase() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId) return null;
  const keyParam = apiKey ? `?key=${encodeURIComponent(apiKey)}` : "";
  return {
    baseUrl: `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`,
    keyParam,
  };
}

async function fetchCollectionRest<T>(collectionName: string): Promise<(T & { id: string })[]> {
  const cfg = getFirestoreBase();
  if (!cfg) return [];

  try {
    const res = await fetch(
      `${cfg.baseUrl}/${encodeURIComponent(collectionName)}${cfg.keyParam}&pageSize=300`,
      {
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { documents?: FirestoreDoc[] };
    return (data.documents || [])
      .map((d) => docToObject<T>(d))
      .filter((item): item is T & { id: string } => Boolean(item && item.id));
  } catch {
    return [];
  }
}

async function fetchDocumentRest<T>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  const cfg = getFirestoreBase();
  if (!cfg || !docId) return null;

  try {
    const res = await fetch(
      `${cfg.baseUrl}/${encodeURIComponent(collectionName)}/${encodeURIComponent(docId)}${cfg.keyParam}`,
      {
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as FirestoreDoc;
    return docToObject<T>(data);
  } catch {
    return null;
  }
}

function normalizeBusinessHours(raw?: Partial<BusinessHours>): BusinessHours | undefined {
  if (!raw || !raw.enabled) return undefined;
  const days = { ...DEFAULT_BUSINESS_HOURS.days };
  if (raw.days) {
    (Object.keys(days) as DayKey[]).forEach((k) => {
      if (raw.days?.[k]) {
        days[k] = {
          open: Boolean(raw.days[k].open),
          start: raw.days[k].start || "08:00",
          end: raw.days[k].end || "18:00",
        };
      }
    });
  }
  return {
    enabled: true,
    is24h: Boolean(raw.is24h),
    days,
  };
}

// Versão ultraleve da empresa para listas/cards (reduz o HTML enviado ao celular em ~80%)
export function toCardBusiness(raw: Business): Business {
  const firstPhoto =
    Array.isArray(raw.gallery) && raw.gallery.length > 0 ? [raw.gallery[0]] : [];

  return {
    id: raw.id,
    ownerId: "",
    name: raw.name || "",
    slug: raw.slug || raw.id,
    category: raw.category || "",
    categories: Array.isArray(raw.categories) ? raw.categories : [],
    subcategory: raw.subcategory || "",
    description: (raw.description || "").slice(0, 140),
    neighborhood: raw.neighborhood || "",
    address: "",
    googleMapsUrl: raw.googleMapsUrl || "",
    showAddressOnSite: raw.showAddressOnSite !== false,
    lat: typeof raw.lat === "number" ? raw.lat : null,
    lng: typeof raw.lng === "number" ? raw.lng : null,
    whatsapp: raw.whatsapp || "",
    logoUrl: raw.logoUrl || "",
    showcaseUrl: raw.showcaseUrl || "",
    coverUrl: raw.coverUrl || "",
    gallery: firstPhoto,
    maxPhotos: raw.maxPhotos ?? 6,
    maxVideos: raw.maxVideos ?? 0,
    coupon: raw.coupon?.active
      ? {
          active: true,
          title: raw.coupon.title || "",
          code: raw.coupon.code || "",
          rules: "",
        }
      : undefined,
    showCouponOnCard: raw.showCouponOnCard,
    businessHours: normalizeBusinessHours(raw.businessHours),
    planId: raw.planId || "",
    isVerified: raw.isVerified !== false,
    isExperienceApproved: raw.isExperienceApproved === true,
    isFeatured: Boolean(raw.isFeatured),
    isApproved: raw.isApproved !== false,
    viewsCount: 0,
    whatsappClicks: 0,
    createdAt: 0,
  };
}

export async function getPublicSettings(): Promise<SiteSettings> {
  const raw = await fetchDocumentRest<Partial<SiteSettings>>("settings", "global");
  if (!raw) return DEFAULT_SITE_SETTINGS;
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...raw,
  };
}

export async function getPublicCategories(): Promise<CategoryDoc[]> {
  const docs = await fetchCollectionRest<CategoryDoc>("categories");
  if (docs.length === 0) return DEFAULT_CATEGORIES;
  const active = docs
    .filter((c) => c.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  return active.length > 0 ? active : DEFAULT_CATEGORIES;
}

export async function getPublicUtilities(): Promise<UtilityDoc[]> {
  const docs = await fetchCollectionRest<UtilityDoc>("utilities");
  if (docs.length === 0) return DEFAULT_UTILITIES;
  const active = docs
    .filter((u) => u.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  return active.length > 0 ? active : DEFAULT_UTILITIES;
}

export async function getPublicBannersByPlacement(
  placement: string
): Promise<PromoBanner[]> {
  const docs = await fetchCollectionRest<PromoBanner>("banners");
  return docs
    .filter((b) => b.active === true && b.placement === placement)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

export async function getPublicApprovedCardBusinesses(): Promise<Business[]> {
  const docs = await fetchCollectionRest<Business>("businesses");
  return docs
    .filter((b) => b.isApproved === true && Boolean(b.name))
    .map((b) => toCardBusiness(b));
}

export async function getPublicBusinessBySlug(
  slug: string
): Promise<Business | null> {
  if (!slug) return null;

  const direct = await fetchDocumentRest<Business>("businesses", slug);
  if (direct && direct.name) return direct;

  const all = await fetchCollectionRest<Business>("businesses");
  return all.find((b) => b.slug === slug || b.id === slug) || null;
}
