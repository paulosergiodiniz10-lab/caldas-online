"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Business, SiteSettings } from "@/types";
import { DEFAULT_SITE_SETTINGS } from "@/lib/constants";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  MapPin,
  Phone,
  Instagram,
  Globe,
  Ticket,
  Youtube,
  CheckCircle2,
  Loader2,
  Store,
} from "lucide-react";

function getYoutubeEmbedUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.includes("embed/")) return trimmed;
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = trimmed.match(/(?:watch\?v=|shorts\/)([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return "";
}

export default function BusinessProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [business, setBusiness] = useState<Business | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  useEffect(() => {
    async function loadBusinessData() {
      if (!slug) return;
      try {
        const bizRef = doc(db, "businesses", slug);
        const bizSnap = await getDoc(bizRef);

        let bizData: Business | null = null;
        if (bizSnap.exists()) {
          bizData = { id: bizSnap.id, ...(bizSnap.data() as Omit<Business, "id">) };
        } else {
          const q = query(collection(db, "businesses"), where("slug", "==", slug));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const d = snap.docs[0];
            bizData = { id: d.id, ...(d.data() as Omit<Business, "id">) };
          }
        }

        if (bizData) {
          setBusiness(bizData);
          await updateDoc(doc(db, "businesses", bizData.id), {
            viewsCount: increment(1),
          });
        }

        const setSnap = await getDoc(doc(db, "settings", "global"));
        if (setSnap.exists()) {
          setSettings((prev) => ({ ...prev, ...(setSnap.data() as Partial<SiteSettings>) }));
        }
      } catch (err) {
        console.error("Erro ao carregar empresa:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBusinessData();
  }, [slug]);

  const handleWhatsAppClick = async () => {
    if (!business) return;
    try {
      await updateDoc(doc(db, "businesses", business.id), {
        whatsappClicks: increment(1),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A4D9C]" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar vipGroupUrl={settings.vipGroupUrl} />
        <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900">Empresa não encontrada</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-sm">
            Esta página pode ter sido removida ou o endereço está incorreto.
          </p>
          <Link
            href="/"
            className="mt-5 bg-[#0A4D9C] text-white font-extrabold text-xs px-5 py-3 rounded-xl"
          >
            Voltar ao Início
          </Link>
        </main>
        <Footer settings={settings} />
      </div>
    );
  }

  const cleanWaNumber = (business.whatsapp || "").replace(/\D/g, "");
  const waUrl = `https://wa.me/55${cleanWaNumber}?text=${encodeURIComponent(
    `Olá! Vi o anúncio da empresa "${business.name}" no Caldas Online e gostaria de mais informações.`
  )}`;

  const hasYoutubeHorizontal = Boolean(business.youtubeHorizontal?.trim());
  const verticalShorts = (business.youtubeVerticals || []).filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f9]">
      <Navbar vipGroupUrl={settings.vipGroupUrl} />

      {/* CAPA DA EMPRESA */}
      <div className="w-full h-48 sm:h-72 bg-slate-800 relative">
        {business.coverUrl ? (
          <img
            src={business.coverUrl}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#0A4D9C] to-blue-700" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
      </div>

      <main className="max-w-4xl w-full mx-auto px-4 -mt-16 sm:-mt-20 relative z-10 space-y-6 pb-12">
        {/* CABEÇALHO COM LOGO E DADOS */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 flex-wrap sm:flex-nowrap">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-md border-4 border-white bg-white shrink-0 -mt-12 sm:-mt-0"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0A4D9C] text-white flex items-center justify-center font-black text-2xl shadow-md border-4 border-white shrink-0 -mt-12 sm:-mt-0">
                {business.name.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {business.name}
                </h1>
                {business.isFeatured && (
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full">
                    DESTAQUE
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                {business.subcategory || business.category} • {business.neighborhood}
              </p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                {business.address}
              </p>
            </div>
          </div>

          {/* BOTÃO WHATSAPP PRINCIPAL */}
          {cleanWaNumber && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-2xl shadow-lg inline-flex items-center justify-center gap-2.5 transition shrink-0"
            >
              <Phone className="w-5 h-5 fill-white" />
              Chamar no WhatsApp
            </a>
          )}
        </div>

        {/* CUPOM DE DESCONTO */}
        {business.coupon?.active && (
          <div className="rounded-3xl bg-gradient-to-r from-orange-500 to-[#FFB800] p-6 text-slate-950 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-950 text-[#FFB800] flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950/10 px-2 py-0.5 rounded-full">
                  Cupom Exclusivo Caldas Online
                </span>
                <h2 className="text-lg font-black mt-0.5">{business.coupon.title}</h2>
                <p className="text-xs font-medium text-slate-900">
                  {business.coupon.rules || "Apresente o código no estabelecimento."}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCopyCoupon(business.coupon?.code || "")}
              className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow transition inline-flex items-center gap-2 shrink-0 w-full sm:w-auto justify-center"
            >
              {copiedCoupon ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Código Copiado!
                </>
              ) : (
                <>Copiar Código: {business.coupon.code}</>
              )}
            </button>
          </div>
        )}

        {/* SOBRE A EMPRESA */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h2 className="font-extrabold text-slate-900">Sobre a Empresa</h2>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {business.description}
          </p>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 flex-wrap">
            {business.instagram && (
              <a
                href={business.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition"
              >
                <Instagram className="w-4 h-4 text-pink-600" /> Instagram
              </a>
            )}
            {business.website && (
              <a
                href={business.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl transition"
              >
                <Globe className="w-4 h-4 text-blue-600" /> Site / Cardápio
              </a>
            )}
          </div>
        </div>

        {/* VÍDEO PRINCIPAL HORIZONTAL */}
        {hasYoutubeHorizontal && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              <h2 className="font-extrabold text-slate-900">Vídeo em Destaque</h2>
            </div>
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 shadow">
              <iframe
                src={getYoutubeEmbedUrl(business.youtubeHorizontal || "")}
                title="Vídeo principal"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* VÍDEOS VERTICAIS (SHORTS) */}
        {verticalShorts.length > 0 && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" />
              <h2 className="font-extrabold text-slate-900">Vídeos Curtos (Shorts)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {verticalShorts.map((link, idx) => (
                <div
                  key={idx}
                  className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-slate-950 shadow"
                >
                  <iframe
                    src={getYoutubeEmbedUrl(link)}
                    title={`Shorts ${idx + 1}`}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GALERIA DE FOTOS */}
        {business.gallery && business.gallery.length > 0 && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-3">
            <h2 className="font-extrabold text-slate-900">Galeria de Fotos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {business.gallery.map((photo, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm"
                >
                  <img
                    src={photo}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-52 object-cover hover:scale-105 transition duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer settings={settings} />
    </div>
  );
}
