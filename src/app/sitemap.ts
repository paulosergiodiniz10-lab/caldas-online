import type { MetadataRoute } from "next";

export const revalidate = 3600;

const SITE_URL = "https://caldasnovasonline.com.br";

interface FirestoreValue {
  stringValue?: string;
  booleanValue?: boolean;
  timestampValue?: string;
  integerValue?: string;
}

interface FirestoreDocument {
  name: string;
  updateTime?: string;
  fields?: Record<string, FirestoreValue>;
}

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
}

async function fetchAllDocuments(
  collectionName: string
): Promise<FirestoreDocument[]> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!projectId) return [];

  const allDocs: FirestoreDocument[] = [];
  let pageToken = "";

  try {
    do {
      const params = new URLSearchParams({ pageSize: "300" });
      if (apiKey) params.set("key", apiKey);
      if (pageToken) params.set("pageToken", pageToken);

      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}?${params.toString()}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });

      if (!res.ok) break;

      const data = (await res.json()) as FirestoreListResponse;
      if (Array.isArray(data.documents)) {
        allDocs.push(...data.documents);
      }
      pageToken = data.nextPageToken || "";
    } while (pageToken);
  } catch (err) {
    console.error(`Erro ao listar ${collectionName} para sitemap:`, err);
  }

  return allDocs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/planos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const [categoryDocs, businessDocs] = await Promise.all([
    fetchAllDocuments("categories"),
    fetchAllDocuments("businesses"),
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categoryDocs
    .map((doc) => {
      const f = doc.fields;
      const docId = doc.name.split("/").pop() || "";
      const slug = f?.slug?.stringValue || docId;
      const isActive = f?.active?.booleanValue !== false;

      if (!slug || !isActive) return null;

      return {
        url: `${SITE_URL}/categoria/${encodeURIComponent(slug)}`,
        lastModified: doc.updateTime ? new Date(doc.updateTime) : now,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const businessRoutes: MetadataRoute.Sitemap = businessDocs
    .map((doc) => {
      const f = doc.fields;
      const docId = doc.name.split("/").pop() || "";
      const slug = f?.slug?.stringValue || docId;
      const isApproved = f?.isApproved?.booleanValue !== false;
      const name = f?.name?.stringValue || "";

      if (!slug || !name || !isApproved) return null;

      return {
        url: `${SITE_URL}/empresa/${encodeURIComponent(slug)}`,
        lastModified: doc.updateTime ? new Date(doc.updateTime) : now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return [...staticRoutes, ...categoryRoutes, ...businessRoutes];
}
