"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Globe,
  Instagram,
  Facebook,
  Ticket,
  Navigation,
  Share2,
  CheckCircle2,
  X,
  Star,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Business } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function BusinessProfilePage() {
  const params = useParams();
  const slug = String(params?.slug || "");

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBusiness() {
      if (!slug) return;
      try {
        const q = query(collection(db, "businesses"), where("slug", "==", slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = {
            id: docSnap.id,
            ...(docSnap.data() as Omit<Business, "id">),
          };
          setBusiness(data);

          // Incrementa contador de visualizações da página
          await updateDoc(doc(db, "businesses", docSnap.id), {
            viewsCount: increment(1),
          });
        }
      } catch (err) {
        console.error("Erro ao carregar empresa:", err);
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-4xl w-full mx-auto px-4 py-10 space-y-4">
          <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
          <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-black text-slate-900">Empresa não encontrada</h1>
          <p className="text-slate-500 text-sm mt-1">
            O link pode ter sido alterado ou o cadastro ainda está em análise.
          </p>
          <Link
            href="/"
            className="mt-4 bg-[#0A4D9C] text-white font-bold text-sm px-5 py-2.5 rounded-xl"
          >
            Voltar para o Guia
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryObj = CATEGORIES.find((c) => c.id === business.category);
  const cleanPhone = business.whatsapp.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá ${business.name}! Encontrei vocês no Caldas Online e gostaria de falar com vocês.`
  )}`;

  const mapsUrl =
    business.lat && business.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${business.name} ${business.address} Caldas Novas GO`
        )}`;

  const handleWhatsAppTrack = async () => {
    try {
      await updateDoc(doc(db, "businesses", business.id), {
        whatsappClicks: increment(1),
      });
    } catch {
      // ignora
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${business.name} - Caldas Online`,
        text: `Confira ${business.name} no Guia Caldas Online!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 py-5 space-y-6 flex-1">
        {/* Voltar e Compartilhar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0A4D9C] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao guia
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-full text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            {copied ? "Link copiado!" : "Compartilhar"}
          </button>
        </div>

        {/* CAPA + LOGO + DADOS PRINCIPAIS */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <div className="relative h-52 sm:h-72 bg-slate-200">
            <img
              src={
                business.coverUrl ||
                "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80"
              }
              alt={business.name}
              className="w-full h-full object-cover"
            />
            {business.isFeatured && (
              <span className="absolute top-4 right-4 inline-flex items-center gap-1 bg-[#FFB800] text-slate-950 text-xs font-extrabold px-3 py-1.5 rounded-full shadow">
                <Star className="w-3.5 h-3.5 fill-slate-950" /> Empresa Destaque
              </span>
            )}
          </div>

          <div className="p-5 sm:p-7 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1.5 shadow-lg border border-slate-100 overflow-hidden shrink-0">
                <img
                  src={
                    business.logoUrl ||
                    business.coverUrl ||
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80"
                  }
                  alt={`Logo ${business.name}`}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsAppTrack}
                  className="bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-sm transition"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  Chamar no WhatsApp
                </a>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-bold text-sm px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm transition"
                >
                  <Navigation className="w-4 h-4" />
                  Como Chegar
                </a>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {categoryObj && (
                  <span className="text-xs font-bold bg-blue-50 text-[#0A4D9C] px-2.5 py-1 rounded-lg">
                    {categoryObj.name}
                  </span>
                )}
                {business.subcategory && (
                  <span className="text-xs font-semibold text-slate-500">
                    • {business.subcategory}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">
                {business.name}
              </h1>

              <p className="text-sm text-slate-600 flex items-start gap-1.5 mt-2">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>
                  {business.address}
                  {business.neighborhood ? ` - ${business.neighborhood}` : ""}, Caldas Novas - GO
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* DESTAQUE ESPECIAL: CUPOM DE DESCONTO */}
        {business.coupon?.active && (
          <div className="rounded-3xl bg-gradient-to-r from-[#FF7A00] via-orange-500 to-[#FFB800] p-1 shadow-md">
            <div className="bg-white rounded-[22px] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-dashed border-orange-300">
              <div className="flex items-start gap-3.5 text-center sm:text-left flex-col sm:flex-row items-center sm:items-start">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                    Benefício Exclusivo Caldas Online
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {business.coupon.title}
                  </h2>
                  {business.coupon.rules && (
                    <p className="text-xs text-slate-500 mt-0.5">{business.coupon.rules}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowCouponModal(true)}
                className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-sm px-5 py-3.5 rounded-xl shadow transition whitespace-nowrap w-full sm:w-auto"
              >
                APRESENTAR CUPOM
              </button>
            </div>
          </div>
        )}

        {/* SOBRE A EMPRESA & REDES SOCIAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base">Sobre a Empresa</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {business.description ||
                `${business.name} oferece atendimento de qualidade em Caldas Novas. Entre em contato pelo WhatsApp ou faça uma visita!`}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base">Canais e Redes</h3>
            <div className="space-y-2.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppTrack}
                className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 hover:text-emerald-600 p-2 rounded-xl hover:bg-slate-50 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span>{business.whatsapp}</span>
              </a>

              {business.instagram && (
                <a
                  href={
                    business.instagram.startsWith("http")
                      ? business.instagram
                      : `https://instagram.com/${business.instagram.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 hover:text-pink-600 p-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <Instagram className="w-4 h-4 text-pink-500" />
                  <span>Instagram</span>
                </a>
              )}

              {business.facebook && (
                <a
                  href={
                    business.facebook.startsWith("http")
                      ? business.facebook
                      : `https://facebook.com/${business.facebook}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 p-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  <span>Facebook</span>
                </a>
              )}

              {business.website && (
                <a
                  href={
                    business.website.startsWith("http")
                      ? business.website
                      : `https://${business.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 hover:text-[#0A4D9C] p-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <Globe className="w-4 h-4 text-[#0A4D9C]" />
                  <span>Visitar Site</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* GALERIA DE FOTOS */}
        {business.gallery && business.gallery.length > 0 && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-base mb-4">Galeria de Fotos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {business.gallery.map((photoUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhoto(photoUrl)}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-100 group"
                >
                  <img
                    src={photoUrl}
                    alt={`${business.name} foto ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE APRESENTAÇÃO DO CUPOM NO BALCÃO */}
      {showCouponModal && business.coupon && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#0A4D9C] to-[#FF7A00] p-5 text-white text-center relative">
              <button
                onClick={() => setShowCouponModal(false)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 p-1.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-xs font-extrabold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                Cupom Validado • Caldas Online
              </span>
              <h3 className="text-xl font-black mt-3">{business.name}</h3>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Benefício</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">
                  {business.coupon.title}
                </p>
              </div>

              {business.coupon.code && (
                <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl py-3 px-4">
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Código Promocional</p>
                  <p className="text-2xl font-black tracking-widest text-[#0A4D9C]">
                    {business.coupon.code}
                  </p>
                </div>
              )}

              {business.coupon.rules && (
                <p className="text-xs text-slate-500">{business.coupon.rules}</p>
              )}

              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Mostre esta tela ao atendente para validar seu desconto.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX DE FOTO */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
        >
          <img
            src={selectedPhoto}
            alt="Ampliação"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
