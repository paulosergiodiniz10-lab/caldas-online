"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Navigation,
  Ticket,
  TrendingUp,
  Star,
  ShieldAlert,
  PhoneCall,
  Store,
  Loader2,
  Clock,
  X,
} from "lucide-react";
import {
  Business,
  PromoBanner,
  SiteSettings,
  CategoryDoc,
  UtilityDoc,
} from "@/types";
import {
  calculateDistanceKm,
  getBusinessOpenStatus,
} from "@/lib/constants";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerSlider } from "@/components/BannerSlider";
import { CategoryIcon } from "@/components/CategoryIcon";
import { BusinessCard } from "@/components/BusinessCard";

interface HomeClientProps {
  initialBusinesses: Business[];
  initialBanners: PromoBanner[];
  initialCategories: CategoryDoc[];
  initialUtilities: UtilityDoc[];
  initialSettings: SiteSettings;
}

// Embaralhamento justo (Fisher-Yates) para rotacionar empresas a cada acesso
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function HomeClient({
  initialBusinesses,
  initialBanners,
  initialCategories,
  initialUtilities,
  initialSettings,
}: HomeClientProps) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [openingCatId, setOpeningCatId] = useState<string | null>(null);
  const [showUtilitiesModal, setShowUtilitiesModal] = useState(false);

  // Filtros e Busca
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyCoupons, setOnlyCoupons] = useState(false);
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Embaralha no cliente após a montagem para manter rotação justa sem erro de hidratação
  useEffect(() => {
    if (initialBusinesses.length > 1) {
      setBusinesses(shuffleArray(initialBusinesses));
    }
  }, [initialBusinesses]);

  const categoryNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    initialCategories.forEach((c) => {
      if (c.slug) map[c.slug] = c.name;
      if (c.id) map[c.id] = c.name;
    });
    return map;
  }, [initialCategories]);

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
        alert("Não foi possível acessar sua localização. Verifique as permissões do navegador.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const processedBusinesses = useMemo(() => {
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
        if (!a.isClosedNow && b.isClosedNow) return -1;
        if (a.isClosedNow && !b.isClosedNow) return 1;

        if (userCoords) {
          if (a.distanceKm !== null && b.distanceKm !== null) {
            return a.distanceKm - b.distanceKm;
          }
          if (a.distanceKm !== null) return -1;
          if (b.distanceKm !== null) return 1;
        }

        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }, [businesses, searchTerm, onlyCoupons, onlyOpenNow, userCoords]);

  const isFiltering = Boolean(
    searchTerm.trim() || onlyCoupons || onlyOpenNow || userCoords
  );

  const validMostSearched = useMemo(() => {
    if (initialSettings.showMostSearched === false) return [];
    return (initialSettings.mostSearchedItems || []).filter(
      (item) => item && item.label && item.label.trim().length > 0
    );
  }, [initialSettings.showMostSearched, initialSettings.mostSearchedItems]);

  const featuredBusinesses = useMemo(() => {
    return businesses
      .filter((b) => b.isFeatured === true)
      .sort((a, b) => {
        const aClosed =
          getBusinessOpenStatus(a.businessHours).hasSchedule &&
          !getBusinessOpenStatus(a.businessHours).isOpen;
        const bClosed =
          getBusinessOpenStatus(b.businessHours).hasSchedule &&
          !getBusinessOpenStatus(b.businessHours).isOpen;
        if (!aClosed && bClosed) return -1;
        if (aClosed && !bClosed) return 1;
        return 0;
      });
  }, [businesses]);

  const regularBusinesses = useMemo(() => {
    return businesses
      .filter((b) => !b.isFeatured)
      .sort((a, b) => {
        const aClosed =
          getBusinessOpenStatus(a.businessHours).hasSchedule &&
          !getBusinessOpenStatus(a.businessHours).isOpen;
        const bClosed =
          getBusinessOpenStatus(b.businessHours).hasSchedule &&
          !getBusinessOpenStatus(b.businessHours).isOpen;
        if (!aClosed && bClosed) return -1;
        if (aClosed && !bClosed) return 1;
        return 0;
      })
      .slice(0, 8);
  }, [businesses]);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar
        vipGroupUrl={initialSettings.vipGroupUrl}
        masterWhatsApp={initialSettings.masterWhatsApp}
      />

      {/* HERO COM BUSCA RÁPIDA E FILTROS NA MÃO */}
      <section className="bg-gradient-to-b from-[#0A4D9C] via-[#0d5bb8] to-[#f4f6f9] pt-6 pb-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-blue-100 text-[11px] sm:text-sm font-semibold uppercase tracking-wider mb-1.5">
            {initialSettings.heroBadge}
          </p>
          <h1 className="text-[23px] sm:text-4xl font-black text-white tracking-tight leading-snug">
            <span>{initialSettings.heroTitlePrefix}</span>{" "}
            <span className="text-[#FFB800] whitespace-nowrap">
              {initialSettings.heroTitleHighlight}
            </span>
          </h1>

          {/* Barra de Busca Principal */}
          <div className="mt-5 max-w-2xl mx-auto bg-white rounded-2xl p-1.5 shadow-xl flex items-center gap-2 border border-blue-200/50">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={initialSettings.searchPlaceholder}
              className="w-full py-2.5 px-1 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="p-1.5 text-slate-400 hover:text-slate-600"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shrink-0"
            >
              Buscar
            </button>
          </div>

          {/* Pills de Ação Instantânea */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyOpenNow(!onlyOpenNow)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full transition shadow-sm cursor-pointer active:scale-95 ${
                onlyOpenNow
                  ? "bg-emerald-600 text-white"
                  : "bg-white/95 hover:bg-white text-slate-800"
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
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full transition shadow-sm cursor-pointer active:scale-95 ${
                userCoords
                  ? "bg-emerald-500 text-white"
                  : "bg-white/95 hover:bg-white text-slate-800"
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
              {userCoords ? "Perto de mim (Ativo)" : "Ordenar por mais perto"}
            </button>

            <button
              type="button"
              onClick={() => setOnlyCoupons(!onlyCoupons)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full transition shadow-sm cursor-pointer active:scale-95 ${
                onlyCoupons
                  ? "bg-[#FF7A00] text-white"
                  : "bg-white/95 hover:bg-white text-slate-800"
              }`}
            >
              <Ticket
                className={`w-3.5 h-3.5 ${
                  onlyCoupons ? "text-white" : "text-orange-500"
                }`}
              />
              Com Cupom de Desconto
            </button>
          </div>
        </div>

        {/* GRID DE SEGMENTOS DINÂMICOS */}
        <div className="max-w-6xl mx-auto mt-7">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5">
            {initialCategories.map((cat) => {
              const catSlug = (cat.slug || cat.id || "").toLowerCase();
              const isUtilitiesCard =
                catSlug === "utilidades" ||
                cat.name.toLowerCase().includes("utilidade");
              const isOpeningThis = openingCatId === cat.id;

              const cardContent = (
                <>
                  <div
                    className={`w-12 h-12 rounded-2xl ${cat.bgColor} flex items-center justify-center shadow-sm transition-transform duration-150 ${
                      isOpeningThis
                        ? "scale-95"
                        : "group-hover:scale-105 group-active:scale-95"
                    }`}
                  >
                    {isOpeningThis ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <CategoryIcon
                        name={cat.iconName}
                        customIconUrl={cat.customIconUrl}
                        className="w-6 h-6 text-white"
                      />
                    )}
                  </div>
                  <span className="font-bold text-slate-900 text-sm mt-2.5 leading-tight">
                    {cat.name}
                  </span>
                  <span
                    className={`text-[11px] mt-0.5 line-clamp-1 ${
                      isOpeningThis ? "text-[#0A4D9C] font-bold" : "text-slate-500"
                    }`}
                  >
                    {isOpeningThis ? "Abrindo..." : cat.subtitle}
                  </span>
                </>
              );

              if (isUtilitiesCard) {
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setShowUtilitiesModal(true)}
                    className="bg-white active:bg-blue-50/80 rounded-2xl p-3.5 shadow-sm hover:shadow-md border border-slate-100 active:border-[#0A4D9C]/40 flex flex-col items-center text-center transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.96] select-none touch-manipulation group cursor-pointer"
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <Link
                  key={cat.id}
                  href={`/categoria/${cat.slug || cat.id}`}
                  prefetch={true}
                  onClick={() => setOpeningCatId(cat.id)}
                  className={`rounded-2xl p-3.5 shadow-sm hover:shadow-md border flex flex-col items-center text-center transition-all duration-150 hover:-translate-y-0.5 active:scale-[0.96] select-none touch-manipulation group ${
                    isOpeningThis
                      ? "bg-blue-50/90 border-[#0A4D9C] ring-2 ring-[#0A4D9C]/30 scale-[0.98]"
                      : "bg-white active:bg-blue-50/80 border-slate-100 active:border-[#0A4D9C]/40"
                  }`}
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <main className="max-w-6xl w-full mx-auto px-4 space-y-8 flex-1 pb-10">
        {/* RESULTADOS DE BUSCA / FILTRO EM TEMPO REAL */}
        {isFiltering && (
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Resultados encontrados ({processedBusinesses.length})
                </h2>
                <p className="text-xs text-slate-500">
                  {onlyOpenNow
                    ? "Mostrando apenas empresas abertas neste momento"
                    : userCoords
                    ? "Ordenados da menor distância para a maior até você"
                    : "Mostrando empresas correspondentes (lojas fechadas vão para o final)"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setOnlyCoupons(false);
                  setOnlyOpenNow(false);
                  setUserCoords(null);
                }}
                className="text-xs font-bold text-[#0A4D9C] hover:underline cursor-pointer"
              >
                Limpar filtros
              </button>
            </div>

            {processedBusinesses.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                Nenhuma empresa encontrada com esse filtro no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {processedBusinesses.map((biz) => (
                  <BusinessCard
                    key={biz.id}
                    business={biz}
                    distanceKm={biz.distanceKm}
                    categoryNamesMap={categoryNamesMap}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* SLIDE DE BANNERS PROMOCIONAIS PRINCIPAIS */}
        <section>
          <BannerSlider banners={initialBanners} />
        </section>

        {/* MAIS PROCURADOS */}
        {validMostSearched.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 leading-none">
                  {initialSettings.mostSearchedTitle || "Mais Procurados"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {initialSettings.mostSearchedSubtitle ||
                    "Acesso rápido aos termos mais buscados em Caldas Novas"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {validMostSearched.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchTerm(item.query || item.label)}
                  className="bg-white hover:bg-blue-50 active:scale-95 border border-slate-200 text-slate-800 font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm whitespace-nowrap transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* EMPRESAS EM DESTAQUE */}
        {featuredBusinesses.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-[#FFB800] fill-[#FFB800]" />
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 leading-none">
                    {initialSettings.featuredTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {initialSettings.featuredSubtitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredBusinesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  categoryNamesMap={categoryNamesMap}
                />
              ))}
            </div>
          </section>
        )}

        {/* EMPRESAS E SERVIÇOS NO GUIA */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-[#0A4D9C]" />
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 leading-none">
                  Empresas e Serviços no Guia
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sugestões selecionadas • Use a busca ou as categorias acima para ver tudo
                </p>
              </div>
            </div>
          </div>

          {businesses.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
              <p className="text-slate-600 font-semibold">
                Ainda não há empresas publicadas. Seja a primeira a aparecer aqui!
              </p>
              <Link
                href="/painel-empresa"
                className="inline-block mt-3 bg-[#0A4D9C] text-white font-bold text-sm px-5 py-2.5 rounded-xl"
              >
                Cadastrar Minha Empresa Grátis
              </Link>
            </div>
          ) : regularBusinesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {regularBusinesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  business={biz}
                  categoryNamesMap={categoryNamesMap}
                />
              ))}
            </div>
          ) : null}
        </section>
      </main>

      {/* POP-UP COMPLETO DE UTILIDADES RÁPIDAS */}
      {showUtilitiesModal && (
        <div
          onClick={() => setShowUtilitiesModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="bg-[#0A4D9C] text-white p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-[#FFB800]" />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-tight">
                    {initialSettings.utilitiesTitle || "Utilidades Públicas"}
                  </h3>
                  <p className="text-xs text-blue-100">
                    {initialSettings.utilitiesSubtitle ||
                      "Toque no serviço desejado para ligar diretamente"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUtilitiesModal(false)}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {initialUtilities.map((util) => (
                <a
                  key={util.id}
                  href={`tel:${util.number.replace(/\D/g, "")}`}
                  className="bg-slate-50 hover:bg-blue-50/70 active:scale-95 border border-slate-200/80 hover:border-[#0A4D9C]/40 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-2xs transition group"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${util.color} text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <CategoryIcon
                      name={util.iconName}
                      customIconUrl={util.customIconUrl}
                      className="w-5 h-5 text-white"
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 leading-tight">
                    {util.name}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-1 bg-white border border-red-200 text-red-600 text-xs font-black px-2.5 py-1 rounded-full">
                    <PhoneCall className="w-3 h-3" />
                    {util.number}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer settings={initialSettings} />
    </div>
  );
}
