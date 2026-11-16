"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_SITE_SETTINGS } from "@/lib/constants";
import { Business, SiteSettings } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  MapPin,
  MessageCircle,
  Instagram,
  Globe,
  Ticket,
  Copy,
  Check,
  Download,
  ArrowLeft,
  Loader2,
  Building2,
  Navigation,
  X,
} from "lucide-react";

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currentY);
  return currentY;
}

export default function BusinessPublicPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [business, setBusiness] = useState<
    (Business & { cep?: string; googleMapsUrl?: string }) | null
  >(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      try {
        const snapSet = await getDoc(doc(db, "settings", "global"));
        if (snapSet.exists()) {
          setSettings((prev) => ({
            ...prev,
            ...(snapSet.data() as Partial<SiteSettings>),
          }));
        }

        const directRef = doc(db, "businesses", slug);
        const directSnap = await getDoc(directRef);

        if (directSnap.exists()) {
          const data = {
            id: directSnap.id,
            ...(directSnap.data() as Business & {
              cep?: string;
              googleMapsUrl?: string;
            }),
          };
          setBusiness(data);
          updateDoc(directRef, { viewsCount: increment(1) }).catch(() => {});
        } else {
          const q = query(
            collection(db, "businesses"),
            where("slug", "==", slug)
          );
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const first = qSnap.docs[0];
            const data = {
              id: first.id,
              ...(first.data() as Business & {
                cep?: string;
                googleMapsUrl?: string;
              }),
            };
            setBusiness(data);
            updateDoc(doc(db, "businesses", first.id), {
              viewsCount: increment(1),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Erro ao carregar empresa:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  const handleTrackWhatsappClick = () => {
    if (!business?.id) return;
    updateDoc(doc(db, "businesses", business.id), {
      whatsappClicks: increment(1),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A4D9C]" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar
          vipGroupUrl={settings.vipGroupUrl}
          masterWhatsApp={settings.masterWhatsApp}
        />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <h1 className="text-2xl font-black text-slate-900">
            Empresa não encontrada
          </h1>
          <p className="text-sm text-slate-500 max-w-md">
            O anúncio que você procurou pode ter sido removido ou alterado.
          </p>
          <Link
            href="/"
            className="bg-[#0A4D9C] text-white font-bold text-xs px-5 py-3 rounded-xl inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o Guia
          </Link>
        </main>
        <Footer settings={settings} />
      </div>
    );
  }

  const cleanPhone = (business.whatsapp || "").replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  const defaultWaMessage = `Olá! Vi a *${business.name}* no guia *Caldas Online* e gostaria de mais informações.`;
  const defaultWaUrl = cleanPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(defaultWaMessage)}`
    : "#";

  const hasCoupon = Boolean(
    business.coupon?.active &&
      (business.coupon?.code || business.coupon?.title)
  );

  const couponCode = (business.coupon?.code || "DESCONTO").toUpperCase();
  const couponTitle = business.coupon?.title || "Desconto Especial";
  const couponRules = business.coupon?.rules || "";

  const fullCouponMessage = `Olá! Estou no site *Caldas Online* na página da empresa *${business.name}* e quero utilizar o cupom *${couponCode}* (${couponTitle}). Como devo proceder?`;

  const couponWaUrl = cleanPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(fullCouponMessage)}`
    : "#";

  const handleCopyCouponMessage = async () => {
    try {
      await navigator.clipboard.writeText(fullCouponMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch {
      alert(fullCouponMessage);
    }
  };

  const handleDownloadCouponImage = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fundo gradiente azul institucional
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, "#0A4D9C");
    bgGrad.addColorStop(1, "#062F63");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Cartão branco central
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(70, 70, 940, 940, 44);
    ctx.fill();

    // Faixa superior laranja
    const topGrad = ctx.createLinearGradient(70, 70, 1010, 210);
    topGrad.addColorStop(0, "#FF7A00");
    topGrad.addColorStop(1, "#FFB800");
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.roundRect(70, 70, 940, 130, [44, 44, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 32px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CUPOM EXCLUSIVO • CALDAS ONLINE", 540, 148);

    // Nome da Empresa
    ctx.fillStyle = "#0A4D9C";
    ctx.font = "900 48px sans-serif";
    const afterNameY = wrapCanvasText(ctx, business.name, 540, 290, 820, 56);

    // Benefício / Oferta
    ctx.fillStyle = "#0F172A";
    ctx.font = "800 40px sans-serif";
    const afterTitleY = wrapCanvasText(
      ctx,
      couponTitle,
      540,
      afterNameY + 85,
      820,
      48
    );

    // Caixa do Código Tracejada
    const boxY = Math.max(510, afterTitleY + 55);
    ctx.fillStyle = "#FFF7ED";
    ctx.strokeStyle = "#FF7A00";
    ctx.lineWidth = 5;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.roundRect(170, boxY, 740, 165, 28);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#9A3412";
    ctx.font = "700 22px sans-serif";
    ctx.fillText("CÓDIGO DO CUPOM", 540, boxY + 52);

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 64px monospace";
    ctx.fillText(couponCode, 540, boxY + 125);

    // Regras e Instrução
    ctx.fillStyle = "#475569";
    ctx.font = "600 26px sans-serif";
    let nextY = boxY + 225;
    if (couponRules) {
      nextY = wrapCanvasText(ctx, `Regras: ${couponRules}`, 540, nextY, 820, 34) + 45;
    }

    ctx.fillStyle = "#0A4D9C";
    ctx.font = "700 25px sans-serif";
    ctx.fillText(
      "Apresente este cupom no WhatsApp ou no balcão da empresa",
      540,
      Math.min(915, nextY + 10)
    );

    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 22px sans-serif";
    ctx.fillText("Guia Comercial de Caldas Novas - GO", 540, 965);

    const link = document.createElement("a");
    link.download = `cupom-${couponCode.toLowerCase()}-${business.slug || "caldas-online"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Monta endereço completo e link do Google Maps
  const fullAddressParts = [
    business.address,
    business.neighborhood ? `Bairro ${business.neighborhood}` : "",
    business.cep ? `CEP ${business.cep}` : "",
    "Caldas Novas - GO",
  ].filter(Boolean);
  const fullAddressText = fullAddressParts.join(" • ");

  const mapsDestinationUrl =
    business.googleMapsUrl && business.googleMapsUrl.trim()
      ? business.googleMapsUrl.trim()
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${business.name} ${fullAddressParts.join(", ")}`
        )}`;

  // Vídeos permitidos pelo plano
  const allowedVideos = business.maxVideos ?? 0;
  const horizontalEmbed =
    allowedVideos >= 1 && business.youtubeHorizontal
      ? getYoutubeEmbedUrl(business.youtubeHorizontal)
      : null;

  const verticalEmbeds =
    allowedVideos > 1 && Array.isArray(business.youtubeVerticals)
      ? business.youtubeVerticals
          .slice(0, allowedVideos - 1)
          .map((url) => getYoutubeEmbedUrl(url))
          .filter((u): u is string => Boolean(u))
      : [];

  const galleryPhotos = Array.isArray(business.gallery)
    ? business.gallery.slice(0, business.maxPhotos ?? 6)
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        vipGroupUrl={settings.vipGroupUrl}
        masterWhatsApp={settings.masterWhatsApp}
      />

      {/* CAPA SUPERIOR */}
      <div className="w-full h-44 sm:h-64 bg-gradient-to-r from-[#0A4D9C] to-[#062F63] relative overflow-hidden">
        {business.coverUrl && (
          <img
            src={business.coverUrl}
            alt={`Capa ${business.name}`}
            className="w-full h-full object-cover opacity-90"
          />
        )}
        <div className="max-w-5xl mx-auto px-4 pt-4 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-slate-950/60 hover:bg-slate-950/80 text-white text-xs font-bold px-3.5 py-2 rounded-full backdrop-blur-sm transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Guia
          </Link>
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 -mt-12 sm:-mt-16 relative z-20 space-y-6 flex-1">
        {/* CARTÃO PRINCIPAL DA EMPRESA */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            {business.logoUrl ? (
              <img
                src={business.logoUrl}
                alt={business.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-md shrink-0 bg-white"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-50 text-[#0A4D9C] flex items-center justify-center shrink-0 border border-blue-100">
                <Building2 className="w-10 h-10" />
              </div>
            )}

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {business.name}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-500">
                {business.subcategory ? `${business.subcategory} • ` : ""}
                {business.neighborhood || "Caldas Novas"}
              </p>
              {business.address && (
                <p className="text-xs text-slate-600 flex items-center gap-1 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#FF7A00] shrink-0" />
                  <span>{business.address}</span>
                </p>
              )}
            </div>
          </div>

          {cleanPhone && (
            <a
              href={defaultWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleTrackWhatsappClick}
              className="bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-sm px-6 py-4 rounded-2xl shadow-md inline-flex items-center justify-center gap-2 transition shrink-0"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              Chamar no WhatsApp
            </a>
          )}
        </div>

        {/* CUPOM DE DESCONTO INTELIGENTE */}
        {hasCoupon && (
          <div className="rounded-3xl bg-gradient-to-r from-[#FF7A00] via-orange-500 to-[#FFB800] p-5 sm:p-7 shadow-md text-slate-950 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-[#FFB800] flex items-center justify-center shrink-0 mt-0.5">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block bg-slate-950/15 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                    Cupom Exclusivo Caldas Online
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black leading-tight">
                    {couponTitle}
                  </h2>
                  {couponRules && (
                    <p className="text-xs sm:text-sm font-bold text-slate-900/90">
                      {couponRules}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-slate-950/85 pt-1">
                    💡 Copie a mensagem para enviar no WhatsApp ou baixe o cupom para apresentar no local.
                  </p>
                </div>
              </div>

              {/* AÇÕES DO CUPOM */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCouponMessage}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-3.5 rounded-xl shadow inline-flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      Mensagem Copiada! ({couponCode})
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#FFB800]" />
                      Copiar Cupom: {couponCode}
                    </>
                  )}
                </button>

                {cleanPhone && (
                  <a
                    href={couponWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleTrackWhatsappClick}
                    className="bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-xs px-4 py-3.5 rounded-xl shadow inline-flex items-center justify-center gap-2 transition"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    Enviar no WhatsApp
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleDownloadCouponImage}
                  className="bg-white/90 hover:bg-white text-slate-950 font-extrabold text-xs px-4 py-3.5 rounded-xl shadow inline-flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#0A4D9C]" />
                  Baixar Cupom
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SOBRE A EMPRESA + ENDEREÇO E LOCALIZAÇÃO */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100 space-y-5">
          <h2 className="text-lg font-black text-slate-900">Sobre a Empresa</h2>

          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {business.description}
          </p>

          {/* Bloco de Endereço Completo */}
          {fullAddressText && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Endereço e Localização
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                    {fullAddressText}
                  </p>
                </div>
              </div>

              <a
                href={mapsDestinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 transition shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" />
                Ver Localização no Mapa
              </a>
            </div>
          )}

          {/* Links Sociais e Localização */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
            {business.instagram && (
              <a
                href={
                  business.instagram.startsWith("http")
                    ? business.instagram
                    : `https://instagram.com/${business.instagram.replace("@", "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl transition"
              >
                <Instagram className="w-4 h-4 text-pink-600" />
                Instagram
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
                className="inline-flex items-center gap-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl transition"
              >
                <Globe className="w-4 h-4 text-[#0A4D9C]" />
                Site / Cardápio
              </a>
            )}

            <a
              href={mapsDestinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-800 px-4 py-2.5 rounded-xl transition"
            >
              <MapPin className="w-4 h-4 text-[#FF7A00]" />
              Como Chegar (Google Maps)
            </a>
          </div>
        </div>

        {/* GALERIA DE FOTOS (ATÉ 6 FOTOS) */}
        {galleryPhotos.length > 0 && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-lg font-black text-slate-900">Galeria de Fotos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {galleryPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxImage(photo)}
                  className="group relative rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100 cursor-pointer"
                >
                  <img
                    src={photo}
                    alt={`${business.name} - Foto ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VÍDEOS DO YOUTUBE (ASSINANTES) */}
        {(horizontalEmbed || verticalEmbeds.length > 0) && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-100 space-y-5">
            <h2 className="text-lg font-black text-slate-900">Vídeos</h2>

            {horizontalEmbed && (
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 shadow">
                <iframe
                  src={horizontalEmbed}
                  title={`Vídeo ${business.name}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}

            {verticalEmbeds.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {verticalEmbeds.map((vUrl, idx) => (
                  <div
                    key={idx}
                    className="aspect-[9/16] w-full rounded-2xl overflow-hidden bg-slate-950 shadow"
                  >
                    <iframe
                      src={vUrl}
                      title={`Vídeo Vertical ${idx + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* LIGHTBOX PARA AMPLIAR FOTO */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 bg-white/15 hover:bg-white/25 text-white p-2.5 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Foto ampliada"
            className="max-w-full max-h-[88vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      <Footer settings={settings} />
    </div>
  );
}
