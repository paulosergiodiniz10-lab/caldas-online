"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Navigation,
  Ticket,
  Search,
  Loader2,
  Clock,
  X,
} from "lucide-react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Business, CategoryDoc, PromoBanner, SiteSettings } from "@/types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SITE_SETTINGS,
  calculateDistanceKm,
  getBusinessOpenStatus,
} from "@/lib/constants";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerSlider } from "@/components/BannerSlider";
import { BusinessCard } from "@/components/BusinessCard";
import { CategoryIcon } from "@/components/CategoryIcon";

const HOME_CACHE_KEY = "cno_home_cache_v1";

// Compatibilidade caso existam empresas cadastradas com slugs antigos
const LEGACY_SLUG_ALIASES: Record<string, string[]> = {
  "onde-comer": ["onde-comer", "alimentacao"],
  "onde-ficar": ["onde-ficar"],
  turismo: ["turismo", "lazer"],
  imoveis: ["imoveis"],
  saude: ["saude", "beleza"],
  "reforma-construcao": ["reforma-construcao", "construcao"],
  "energia-solar": ["energia-solar"],
  "ar-condicionado": ["ar-condicionado"],
  "automotivo-mobilidade": ["automotivo-mobilidade", "automotivo"],
  "servicos-profissionais": ["servicos-profissionais", "servicos", "comercio"],
};

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function toLightweightBusiness(id: string, raw: Omit<Business, "id">): Business {
  const firstGalleryPhoto =
    Array.isArray(raw.gallery) && raw.gallery.length > 0 ? [raw.gallery[0]] : [];

  return {
    ...raw,
    id,
    gallery: firstGalleryPhoto,
    youtubeHorizontal: "",
    youtubeVerticals: [],
  };
}

function matchesCategorySlugs(biz: Business, targetSlugs: string[]): boolean {
  const matchesPrimary = targetSlugs.includes(biz.category);
  const matchesExtra =
    Array.isArray(biz.categories) &&
    biz.categories.some((c) => targetSlugs.includes(c));
  return matchesPrimary || matchesExtra;
}

interface CategoryCachePayload {
  category?: CategoryDoc;
  businesses: Business[];
  banners: PromoBanner[];
  settings: SiteSettings;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = String(params?.slug || "");

  const [category, setCategory] = useState<CategoryDoc | undefined>(() =>
    DEFAULT_CATEGORIES.find((c) => (c.slug || c.id) === slug)
  );
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [onlyCoupons, setOnlyCoupons] = useState(false);
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    const targetSlugs = LEGACY_SLUG_ALIASES[slug] || [slug];
    const catCacheKey = `cno_cat_cache_${slug}`;

    // 1. Hidrata imediatamente do cache local (da própria categoria ou do cache da Home) para 0ms de espera no 4G/5G
    try {
      const catCacheRaw = sessionStorage.getItem(catCacheKey);
      if (catCacheRaw) {
        const parsed = JSON.parse(catCacheRaw) as CategoryCachePayload;
        if (parsed.category) setCategory(parsed.category);
        if (Array.isArray(parsed.businesses)) {
          setBusinesses(shuffleArray(parsed.businesses));
          setLoading(false);
        }
        if (Array.isArray(parsed.banners)) setBanners(parsed.banners);
        if (parsed.settings) {
          setSettings((prev) => ({ ...prev, ...parsed.settings }));
        }
      } else {
        const homeCacheRaw = sessionStorage.getItem(HOME_CACHE_KEY);
        if (homeCacheRaw) {
          const parsedHome = JSON.parse(homeCacheRaw) as {
            businesses?: Business[];
            categories?: CategoryDoc[];
            settings?: SiteSettings;
          };
          const foundCat = parsedHome.categories?.find(
            (c) => (c.slug || c.id) === slug
          );
          if (foundCat) setCategory(foundCat);

          if (Array.isArray(parsedHome.businesses) && parsedHome.businesses.length > 0) {
            const preFiltered = parsedHome.businesses.filter((b) =>
              matchesCategorySlugs(b, targetSlugs)
            );
            setBusinesses(shuffleArray(preFiltered));
            setLoading(false);
          }

          if (parsedHome.settings) {
            setSettings((prev) => ({ ...prev, ...parsedHome.settings }));
          }
        }
      }
    } catch {
      // Ignora erro de leitura de storage
    }

    async function loadCategoryData() {
      try {
        // 2. Executa todas as 4 consultas no Firestore em paralelo
        const [catRes, bizRes, banRes, setRes] = await Promise.allSettled([
          getDoc(doc(db, "categories", slug)),
          getDocs(query(collection(db, "businesses"), where("isApproved", "==", true))),
          getDocs(
            query(
              collection(db, "banners"),
              where("active", "==", true),
              where("placement", "==", slug)
            )
          ),
          getDoc(doc(db, "settings", "global")),
        ]);

        if (!isMounted) return;

        let nextCategory = category;
        let nextBusinesses = businesses;
        let nextBanners = banners;
        let nextSettings = settings;

        if (catRes.status === "fulfilled" && catRes.value.exists()) {
          nextCategory = {
            id: catRes.value.id,
            ...(catRes.value.data() as Omit<CategoryDoc, "id">),
          };
          setCategory(nextCategory);
        } else {
          nextCategory = DEFAULT_CATEGORIES.find((c) => (c.slug || c.id) === slug);
          if (nextCategory) setCategory(nextCategory);
        }

        if (bizRes.status === "fulfilled") {
          const listBiz: Business[] = bizRes.value.docs
            .map((d) => toLightweightBusiness(d.id, d.data() as Omit<Business, "id">))
            .filter((biz) => matchesCategorySlugs(biz, targetSlugs));

          nextBusinesses = listBiz;
          setBusinesses(shuffleArray(listBiz));
        }

        if (banRes.status === "fulfilled") {
          const listBan: PromoBanner[] = banRes.value.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<PromoBanner, "id">),
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          nextBanners = listBan;
          setBanners(listBan);
        }

        if (setRes.status === "fulfilled" && setRes.value.exists()) {
          nextSettings = {
            ...DEFAULT_SITE_SETTINGS,
            ...(setRes.value.data() as Partial<SiteSettings>),
          };
          setSettings(nextSettings);
        }

        try {
          const payload: CategoryCachePayload = {
            category: nextCategory,
            businesses: nextBusinesses,
            banners: nextBanners,
            settings: nextSettings,
          };
          sessionStorage.setItem(catCacheKey, JSON.stringify(payload));
        } catch {
          // Ignora limite de storage
        }
      } catch (err) {
        console.error("Erro ao carregar categoria:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCategoryData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleActivateLocation = () => {
    if (userCoords) {
      setUserCoords(null);
      return;
    }
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        alert("Não foi possível obter sua localização.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Temas rápidos cadastrados no Master para este segmento (ignora vazios)
  const validQuickTags = useMemo(() => {
    return (category?.quickTags || [])
      .map((t) => (t || "").trim())
      .filter((t) => t.length > 0);
  }, [category?.quickTags]);

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return businesses
      .map((biz) => {
        let distanceKm: number | null = null;
        if (
          userCoords &&
          biz.showAddressOnSite !== false &&
          typeof biz.lat === "number" &&
          typeof biz.lng === "number"
        ) {
          distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, biz.lat, biz.lng);
        }
        const status = getBusinessOpenStatus(biz.businessHours);
        const isClosedNow = status.hasSchedule && !status.isOpen;
        return { ...biz, distanceKm, isClosedNow };
      })
      .filter((biz) => {
        if (onlyOpenNow && biz.isClosedNow) return false;
        if (onlyCoupons && !biz.coupon?.active) return false;
        if (!term) return true;
        return (
          biz.name.toLowerCase().includes(term) ||
          biz.subcategory?.toLowerCase().includes(term) ||
          (biz.showAddressOnSite !== false &&
            biz.neighborhood?.toLowerCase().includes(term)) ||
          biz.description?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // 1. Lojas fechadas no momento vão automaticamente para o final da fila
        if (!a.isClosedNow && b.isClosedNow) return -1;
        if (a.isClosedNow && !b.isClosedNow) return 1;

        // 2. GPS mais próximo
        if (userCoords) {
          if (a.distanceKm !== null && b.distanceKm !== null) {
            return a.distanceKm - b.distanceKm;
          }
          if (a.distanceKm !== null) return -1;
          if (b.distanceKm !== null) return 1;
        }

        // 3. Destaques no topo
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [businesses, searchTerm, onlyCoupons, onlyOpenNow, userCoords]);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        vipGroupUrl={settings.vipGroupUrl}
        masterWhatsApp={settings.masterWhatsApp}
      />

      {/* Cabeçalho do Segmento */}
      <div className="bg-white border-b border-slate-200 py-5 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A4D9C] hover:underline mb-3 active:scale-95 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o início
          </Link>

          <div className="flex items-center gap-3.5">
            {category && (
              <div
                className={`w-12 h-12 rounded-2xl ${category.bgColor} flex items-center justify-center shadow-sm shrink-0`}
              >
                <CategoryIcon
                  name={category.iconName}
                  customIconUrl={category.customIconUrl}
                  className="w-6 h-6 text-white"
                />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {category ? category.name : "Segmento"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {category?.subtitle || "Empresas cadastradas em Caldas Novas"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl w-full mx-auto px-4 py-6 space-y-6 flex-1">
        {/* Slide de Banners Exclusivos do Segmento */}
        <BannerSlider banners={banners} categoryName={category?.name} />

        {/* Barra de Filtros do Segmento + Temas Rápidos */}
        <div className="space-y-3">
          <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 flex-1">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Buscar em ${category?.name || "categoria"}...`}
                className="bg-transparent text-sm w-full focus:outline-none text-slate-800"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  title="Limpar busca"
                  className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setOnlyOpenNow(!onlyOpenNow)}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl transition active:scale-95 cursor-pointer ${
                  onlyOpenNow
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                <Clock
                  className={`w-3.5 h-3.5 ${
                    onlyOpenNow ? "text-white" : "text-emerald-600"
                  }`}
                />
                Abertas agora
              </button>

              <button
                type="button"
                onClick={handleActivateLocation}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl transition active:scale-95 cursor-pointer ${
                  userCoords
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                {locating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation
                    className={`w-3.5 h-3.5 ${
                      userCoords ? "text-white" : "text-orange-500"
                    }`}
                  />
                )}
                {userCoords ? "Mais perto (Ativo)" : "Ordenar por mais perto"}
              </button>

              <button
                type="button"
                onClick={() => setOnlyCoupons(!onlyCoupons)}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl transition active:scale-95 cursor-pointer ${
                  onlyCoupons
                    ? "bg-[#FF7A00] text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                }`}
              >
                <Ticket
                  className={`w-3.5 h-3.5 ${
                    onlyCoupons ? "text-white" : "text-orange-500"
                  }`}
                />
                Com Cupom
              </button>
            </div>
          </div>

          {/* PÍLULAS DE TEMAS RÁPIDOS (EXIBE SOMENTE SE CADASTRADO NO MASTER PARA ESTE SEGMENTO) */}
          {validQuickTags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className={`text-xs font-extrabold px-4 py-2 rounded-full border transition active:scale-95 whitespace-nowrap cursor-pointer ${
                  searchTerm.trim() === ""
                    ? "bg-[#0A4D9C] text-white border-[#0A4D9C] shadow-xs"
                    : "bg-white hover:bg-blue-50 text-slate-700 border-slate-200"
                }`}
              >
                Todos
              </button>

              {validQuickTags.map((tag, idx) => {
                const isSelected =
                  searchTerm.trim().toLowerCase() === tag.toLowerCase();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSearchTerm(isSelected ? "" : tag)}
                    className={`text-xs font-extrabold px-4 py-2 rounded-full border transition active:scale-95 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-[#0A4D9C] text-white border-[#0A4D9C] shadow-xs"
                        : "bg-white hover:bg-blue-50 text-[#0A4D9C] border-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Listagem das Empresas */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-slate-100">
            <p className="text-slate-600 font-semibold">
              Nenhuma empresa encontrada neste segmento com os filtros atuais.
            </p>
            <Link
              href="/painel-empresa"
              className="inline-block mt-4 bg-[#0A4D9C] text-white font-bold text-sm px-5 py-2.5 rounded-xl"
            >
              Cadastrar empresa neste segmento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredList.map((biz) => (
              <BusinessCard
                key={biz.id}
                business={biz}
                distanceKm={biz.distanceKm}
              />
            ))}
          </div>
        )}
      </main>

      <Footer settings={settings} />
    </div>
  );
}
