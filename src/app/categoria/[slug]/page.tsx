import {
  getPublicApprovedCardBusinesses,
  getPublicBannersByPlacement,
  getPublicCategories,
  getPublicSettings,
} from "@/lib/publicData";
import { CategoryClient } from "@/components/CategoryClient";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const LEGACY_SLUG_ALIASES: Record<string, string[]> = {
  "onde-comer": ["onde-comer", "alimentacao"],
  "onde-ficar": ["onde-ficar"],
  turismo: ["turismo", "lazer"],
  experiencias: ["experiencias", "experiencia"],
  imoveis: ["imoveis"],
  saude: ["saude", "beleza"],
  "reforma-construcao": ["reforma-construcao", "construcao"],
  "energia-solar": ["energia-solar"],
  "ar-condicionado": ["ar-condicionado"],
  "automotivo-mobilidade": ["automotivo-mobilidade", "automotivo"],
  "servicos-profissionais": ["servicos-profissionais", "servicos", "comercio"],
};

function isExperienceSlug(slugValue: string): boolean {
  const clean = (slugValue || "").toLowerCase().trim();
  return clean === "experiencias" || clean === "experiencia";
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = String(slug || "");
  const targetSlugs = LEGACY_SLUG_ALIASES[cleanSlug] || [cleanSlug];

  const [allBusinesses, banners, categories, settings] = await Promise.all([
    getPublicApprovedCardBusinesses(),
    getPublicBannersByPlacement(cleanSlug),
    getPublicCategories(),
    getPublicSettings(),
  ]);

  const currentCategory = categories.find(
    (c) => (c.slug || c.id) === cleanSlug || c.id === cleanSlug
  );

  const categoryNamesMap: Record<string, string> = {};
  categories.forEach((c) => {
    if (c.slug) categoryNamesMap[c.slug] = c.name;
    if (c.id) categoryNamesMap[c.id] = c.name;
  });

  const filteredBusinesses = allBusinesses.filter((biz) => {
    // Regra exclusiva Rota Além das Águas: categoria Experiências só exibe empresas aprovadas no Master
    if (isExperienceSlug(cleanSlug) && biz.isExperienceApproved !== true) {
      return false;
    }

    const matchesPrimary = targetSlugs.includes(biz.category);
    const matchesExtra =
      Array.isArray(biz.categories) &&
      biz.categories.some((c) => targetSlugs.includes(c));
    return matchesPrimary || matchesExtra;
  });

  return (
    <CategoryClient
      slug={cleanSlug}
      initialCategory={currentCategory}
      initialBusinesses={filteredBusinesses}
      initialBanners={banners}
      initialSettings={settings}
      categoryNamesMap={categoryNamesMap}
    />
  );
}
