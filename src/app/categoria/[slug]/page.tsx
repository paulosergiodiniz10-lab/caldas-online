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
} from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Business, PromoBanner } from "@/types";
import { CATEGORIES, calculateDistanceKm } from "@/lib/constants";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BannerSlider } from "@/components/BannerSlider";
import { BusinessCard } from "@/components/BusinessCard";
import { CategoryIcon } from "@/components/CategoryIcon";

export default function CategoryPage() {
  const params = useParams();
  const slug = String(params?.slug || "");
  const category = CATEGORIES.find((c) => c.id === slug);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [onlyCoupons, setOnlyCoupons] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    async function loadCategoryData() {
      if (!slug) return;
      try {
        const qBiz = query(
          collection(db, "businesses"),
          where("isApproved", "==", true),
          where("category", "==", slug)
        );
        const snapBiz = await getDocs(qBiz);
        const listBiz: Business[] = snapBiz.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Business, "id">),
        }));
        setBusinesses(listBiz);

        // Banners específicos deste segmento
        const qBan = query(
          collection(db, "banners"),
          where("active", "==", true),
          where("placement", "==", slug)
        );
        const snapBan = await getDocs(qBan);
        const listBan: PromoBanner[] = snapBan.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<PromoBanner, "id">) }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setBanners(listBan);
      } catch (err) {
        console.error("Erro ao carregar categoria:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryData();
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

  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return businesses
      .map((biz) => {
        let distanceKm: number | null = null;
        if (userCoords && typeof biz.lat === "number" && typeof biz.lng === "number") {
          distanceKm = calculateDistanceKm(userCoords.lat, userCoords.lng, biz.lat, biz.lng);
        }
        return { ...biz, distanceKm };
      })
      .filter((biz) => {
        if (onlyCoupons && !biz.coupon?.active) return false;
        if (!term) return true;
        return (
          biz.name.toLowerCase().includes(term) ||
          biz.subcategory?.toLowerCase().includes(term) ||
          biz.neighborhood?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
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
  }, [businesses, searchTerm, onlyCoupons, userCoords]);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      {/* Cabeçalho do Segmento */}
      <div className="bg-white border-b border-slate-200 py-5 px-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A4D9C] hover:underline mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o início
          </Link>

          <div className="flex items-center gap-3.5">
            {category && (
              <div
                className={`w-12 h-12 rounded-2xl ${category.bgColor} flex items-center justify-center shadow-sm shrink-0`}
              >
                <CategoryIcon name={category.iconName} className="w-6 h-6 text-white" />
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

        {/* Barra de Filtros do Segmento */}
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 flex-1">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Buscar em ${category?.name || "categoria"}...`}
              className="bg-transparent text-sm w-full focus:outline-none text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleActivateLocation}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl transition ${
                userCoords
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800"
              }`}
            >
              {locating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-orange-500" />
              )}
              {userCoords ? "Mais perto (Ativo)" : "Ordenar por mais perto"}
            </button>

            <button
              onClick={() => setOnlyCoupons(!onlyCoupons)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl transition ${
                onlyCoupons
                  ? "bg-[#FF7A00] text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-800"
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-orange-500" />
              Com Cupom
            </button>
          </div>
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

      <Footer />
    </div>
  );
}
