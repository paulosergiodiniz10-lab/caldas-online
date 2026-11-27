import {
  getPublicApprovedCardBusinesses,
  getPublicBannersByPlacement,
  getPublicCategories,
  getPublicUtilities,
  getPublicSettings,
} from "@/lib/publicData";
import { HomeClient } from "@/components/HomeClient";

export const revalidate = 60;

export default async function HomePage() {
  const [businesses, banners, categories, utilities, settings] =
    await Promise.all([
      getPublicApprovedCardBusinesses(),
      getPublicBannersByPlacement("home"),
      getPublicCategories(),
      getPublicUtilities(),
      getPublicSettings(),
    ]);

  return (
    <HomeClient
      initialBusinesses={businesses}
      initialBanners={banners}
      initialCategories={categories}
      initialUtilities={utilities}
      initialSettings={settings}
    />
  );
}
