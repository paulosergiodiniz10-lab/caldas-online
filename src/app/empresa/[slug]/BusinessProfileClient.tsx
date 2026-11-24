"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
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
import { auth, db } from "@/lib/firebase";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import {
  DEFAULT_SITE_SETTINGS,
  WEEK_DAYS,
  getBusinessOpenStatus,
} from "@/lib/constants";
import { Business, DayKey, SiteSettings } from "@/types";
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
  Clock,
  ShieldAlert,
  Share2,
  X,
} from "lucide-react";

const MASTER_EMAIL = "caldasonline10@gmail.com";

const JS_DAY_TO_KEY: DayKey[] = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];

type BusinessWithExtra = Business & {
  cep?: string;
  googleMapsUrl?: string;
  showAddressOnSite?: boolean;
};

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

function formatDateTimePtBr(date: Date): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} às ${hh}:${min}`;
}

export function BusinessProfileClient({ initialSlug }: { initialSlug?: string }) {
  const params = useParams();
  const slug =
    initialSlug || (typeof params?.slug === "string" ? params.slug : "");

  const [business, setBusiness] = useState<BusinessWithExtra | null>(null);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [isMasterUser, setIsMasterUser] = useState(false);

  const [copied, setCopied] = useState(false);
  const [sharedCopied, setSharedCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [issuedAt, setIssuedAt] = useState<Date | null>(null);

  useEffect(() => {
    setIssuedAt(new Date());
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUserUid(u?.uid || null);
      setIsMasterUser((u?.email || "").toLowerCase() === MASTER_EMAIL);
    });
    return () => unsub();
  }, []);

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
          const raw = directSnap.data() as Omit<BusinessWithExtra, "id">;
          const loaded = {
            ...raw,
            id: directSnap.id,
          };
          setBusiness(loaded);
          if (loaded.isApproved !== false) {
            updateDoc(directRef, { viewsCount: increment(1) }).catch(() => {});
          }
        } else {
          const q = query(
            collection(db, "businesses"),
            where("slug", "==", slug)
          );
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            const first = qSnap.docs[0];
            const raw = first.data() as Omit<BusinessWithExtra, "id">;
            const loaded = {
              ...raw,
              id: first.id,
            };
            setBusiness(loaded);
            if (loaded.isApproved !== false) {
              updateDoc(doc(db, "businesses", first.id), {
                viewsCount: increment(1),
              }).catch(() => {});
            }
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
    if (!business?.id || business.isApproved === false) return;
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

  const isPendingOrBlocked = business.isApproved === false;
  const isOwner = Boolean(currentUserUid && business.ownerId === currentUserUid);
  const canPreview = isMasterUser || isOwner;

  // Bloqueia acesso público enquanto não estiver aprovada pelo Master
  if (isPendingOrBlocked && !canPreview) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar
          vipGroupUrl={settings.vipGroupUrl}
          masterWhatsApp={settings.masterWhatsApp}
        />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Página em Análise pela Moderação
          </h1>
          <p className="text-sm text-slate-500 max-w-md">
            Este cadastro está passando por nossa verificação de segurança e estará disponível em breve no guia Caldas Novas Online.
          </p>
          <Link
            href="/"
            className="bg-[#0A4D9C] text-white font-bold text-xs px-5 py-3 rounded-xl inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Explorar Empresas Publicadas
          </Link>
        </main>
        <Footer settings={settings} />
      </div>
    );
  }

  const cleanPhone = (business.whatsapp || "").replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  const defaultWaMessage = `Olá! Vi a *${business.name}* no guia *Caldas Novas Online* e gostaria de mais informações.`;
  const defaultWaUrl = cleanPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(defaultWaMessage)}`
    : "#";

  const handleSharePage = async () => {
    const shareUrl =
      typeof window !== "undefined"
        ? window.location.href
        : `https://caldasnovasonline.com.br/empresa/${business.slug || business.id}`;
    const shareText = `Confira *${business.name}* no guia Caldas Novas Online: ${shareUrl}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${business.name} • Caldas Novas Online`,
          text: `Confira ${business.name} em Caldas Novas - GO`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback para copiar/abrir WhatsApp
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setSharedCopied(true);
      setTimeout(() => setSharedCopied(false), 3000);
    } catch {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(shareText)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const openStatus = getBusinessOpenStatus(business.businessHours);
  const isClosedNow = openStatus.hasSchedule && !openStatus.isOpen;
  const isVerified = business.isVerified !== false;

  const localCaldasNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  );
  const todayKey = JS_DAY_TO_KEY[localCaldasNow.getDay()];

  const hasCoupon = Boolean(
    business.coupon?.active &&
      (business.coupon?.code || business.coupon?.title)
  );

  const couponCode = (business.coupon?.code || "DESCONTO").toUpperCase();
  const couponTitle = business.coupon?.title || "Desconto Especial";
  const couponRules = business.coupon?.rules || "";

  const nowDate = issuedAt || new Date();
  const expiresDate = new Date(nowDate.getTime() + 24 * 60 * 60 * 1000);
  const validUntilText = formatDateTimePtBr(expiresDate);

  const fullCouponMessage = `Olá! Estou no site *Caldas Novas Online* na página da empresa *${business.name}* e quero utilizar o cupom *${couponCode}* (${couponTitle}), válido até ${validUntilText}. Como devo proceder?`;

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
    const emitNow = new Date();
    const expire24h = new Date(emitNow.getTime() + 24 * 60 * 60 * 1000);

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
    bgGrad.addColorStop(0, "#0A4D9C");
    bgGrad.addColorStop(1, "#062F63");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(70, 70, 940, 940, 44);
    ctx.fill();

    const topGrad = ctx.createLinearGradient(70, 70, 1010, 210);
    topGrad.addColorStop(0, "#FF7A00");
    topGrad.addColorStop(1, "#FFB800");
    ctx.fillStyle = topGrad;
    ctx.beginPath();
    ctx.roundRect(70, 70, 940, 130, [44, 44, 0, 0]);
    ctx.fill();

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 30px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CUPOM EXCLUSIVO • CALDAS NOVAS ONLINE", 540, 148);

    ctx.fillStyle = "#0A4D9C";
    ctx.font = "900 48px sans-serif";
    const afterNameY = wrapCanvasText(ctx, business.name, 540, 280, 820, 56);

    ctx.fillStyle = "#0F172A";
    ctx.font = "800 40px sans-serif";
    const afterTitleY = wrapCanvasText(
      ctx,
      couponTitle,
      540,
      afterNameY + 80,
      820,
      48
    );

    const boxY = Math.max(495, afterTitleY + 50);
    ctx.fillStyle = "#FFF7ED";
    ctx.strokeStyle = "#FF7A00";
    ctx.lineWidth = 5;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.roundRect(170, boxY, 740, 160, 28);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#9A3412";
    ctx.font = "700 22px sans-serif";
    ctx.fillText("CÓDIGO DO CUPOM", 540, boxY + 50);

    ctx.fillStyle = "#0F172A";
    ctx.font = "900 64px monospace";
    ctx.fillText(couponCode, 540, boxY + 122);

    ctx.fillStyle = "#475569";
    ctx.font = "600 25px sans-serif";
    let nextY = boxY + 215;
    if (couponRules) {
      nextY = wrapCanvasText(ctx, `Regras: ${couponRules}`, 540, nextY, 820, 32) + 40;
    }

    ctx.fillStyle = "#0A4D9C";
    ctx.font = "700 24px sans-serif";
    ctx.fillText(
      "Apresente este cupom no WhatsApp ou no balcão da empresa",
      540,
      nextY
    );

    const badgeY = Math.min(865, nextY + 32);
    ctx.fillStyle = "#FEF2F2";
    ctx.beginPath();
    ctx.roundRect(140, badgeY, 800, 52, 16);
    ctx.fill();

    ctx.fillStyle = "#B91C1C";
    ctx.font = "800 22px sans-serif";
    ctx.fillText(
      `⏳ VÁLIDO POR 24H • Expira em ${formatDateTimePtBr(expire24h)}`,
      540,
      badgeY + 34
    );

    ctx.fillStyle = "#94A3B8";
    ctx.font = "600 21px sans-serif";
    ctx.fillText("Guia Comercial de Caldas Novas - GO", 540, 968);

    const link = document.createElement("a");
    link.download = `cupom-${couponCode.toLowerCase()}-${business.slug || "caldas-novas-online"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Regras de privacidade de endereço e localização
  const isAddressVisible = business.showAddressOnSite !== false;
  const hasGoogleMapsLink = Boolean(
    business.googleMapsUrl && business.googleMapsUrl.trim()
  );
  const showLocationAction = isAddressVisible && hasGoogleMapsLink;
  const mapsDestinationUrl = hasGoogleMapsLink
    ? business.googleMapsUrl!.trim()
    : "#";

  const hasStreetAddress = Boolean(business.address && business.address.trim());
  const fullAddressParts = [
    business.address,
    business.neighborhood ? `Bairro ${business.neighborhood}` : "",
    business.cep ? `CEP ${business.cep}` : "",
    "Caldas Novas - GO",
  ].filter(Boolean);
  const fullAddressText = hasStreetAddress ? fullAddressParts.join(" • ") : "";

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
    ? business.gallery
        .slice(0, business.maxPhotos ?? 6)
        .map((url) => optimizeCloudinaryUrl(url))
    : [];

  const optimizedCover = optimizeCloudinaryUrl(business.coverUrl);
  const optimizedLogo = optimizeCloudinaryUrl(business.logoUrl);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        vipGroupUrl={settings.vipGroupUrl}
        masterWhatsApp={settings.masterWhatsApp}
      />

      {/* TARJA DE VISTORIA PRÉVIA */}
      {isPendingOrBlocked && canPreview && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-extrabold flex flex-wrap items-center justify-center gap-2 text-center">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            MODO DE VISTORIA PRÉVIA: Esta página ainda NÃO está visível ao público.
          </span>
          {isMasterUser && (
            <Link
              href="/master"
              className="underline bg-slate-950 text-white px-2.5 py-1 rounded-lg ml-1"
            >
              Voltar ao Master para Liberar
            </Link>
          )}
        </div>
      )}

      {/* BARRA DE AÇÕES ACIMA DO BANNER + BANNER CAPA 100% LIVRE (3:1) */}
      <div className="max-w-5xl w-full mx-auto px-4 pt-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 text-xs font-extrabold px-3.5 py-2 rounded-full shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#0A4D9C]" /> Voltar ao Guia
          </Link>

          <button
            type="button"
            onClick={handleSharePage}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 text-xs font-extrabold px-3.5 py-2 rounded-full shadow-2xs transition cursor-pointer"
            title="Compartilhar página da empresa"
          >
            {sharedCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Link Copiado!
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-[#0A4D9C]" />
                Compartilhar
              </>
            )}
          </button>
        </div>

        <div
          className={`w-full rounded-3xl bg-gradient-to-r from-[#0A4D9C] to-[#062F63] relative overflow-hidden shadow-sm border border-slate-200/80 ${
            optimizedCover ? "aspect-[3/1]" : "h-32 sm:h-40"
          }`}
        >
          {optimizedCover && (
            <img
              src={optimizedCover}
              alt={`Capa ${business.name}`}
              decoding="async"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      <main className="max-w-5xl w-full mx-auto px-4 mt-4 relative z-20 space-y-6 flex-1 pb-8">
        {/* CARTÃO PRINCIPAL DO TOPO */}
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-md border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {optimizedLogo ? (
              <img
                src={optimizedLogo}
                alt={business.name}
                decoding="async"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0 bg-white"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-blue-50 text-[#0A4D9C] flex items-center justify-center shrink-0 border border-blue-100">
                <Building2 className="w-10 h-10" />
              </div>
            )}

            <div className="space-y-1.5">
              {/* SELOS: EMPRESA VERIFICADA (ESTILO META) + STATUS DE FUNCIONAMENTO */}
              <div className="flex flex-wrap items-center gap-2">
                {isVerified && (
                  <span className="inline-flex items-center gap-1.5 bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/25 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#1877F2] text-white inline-flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                    </span>
                    Empresa Verificada
                  </span>
                )}

                {openStatus.hasSchedule && (
                  openStatus.isOpen ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {openStatus.label}
                      {openStatus.detail ? ` • ${openStatus.detail}` : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      Fechado agora
                    </span>
                  )
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {business.name}
              </h1>

              {business.subcategory && (
                <p className="text-xs sm:text-sm font-semibold text-slate-500">
                  {business.subcategory}
                </p>
              )}
            </div>
          </div>

          {cleanPhone && (
            <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
              <a
                href={defaultWaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleTrackWhatsappClick}
                className={`font-extrabold text-sm px-6 py-4 rounded-2xl shadow-md inline-flex items-center justify-center gap-2 transition ${
                  isClosedNow
                    ? "bg-slate-700 hover:bg-slate-800 text-white"
                    : "bg-[#1DB954] hover:bg-[#18a349] text-white"
                }`}
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                {isClosedNow ? "Deixar Mensagem no WhatsApp" : "Chamar no WhatsApp"}
              </a>
              {isClosedNow && (
                <span className="text-[11px] font-bold text-red-600 text-center sm:text-right">
                  Loja fechada no momento
                </span>
              )}
            </div>
          )}
        </div>

        {/* CUPOM DE DESCONTO INTELIGENTE (VÁLIDO POR 24H) */}
        {hasCoupon && (
          <div className="rounded-3xl bg-gradient-to-r from-[#FF7A00] via-orange-500 to-[#FFB800] p-5 sm:p-7 shadow-md text-slate-950 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-[#FFB800] flex items-center justify-center shrink-0 mt-0.5">
                  <Ticket className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-block bg-slate-950/15 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      Cupom Exclusivo Caldas Novas Online
                    </span>
                    <span className="inline-flex items-center gap-1 bg-slate-950 text-[#FFB800] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" /> Válido por 24h
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black leading-tight">
                    {couponTitle}
                  </h2>
                  {couponRules && (
                    <p className="text-xs sm:text-sm font-bold text-slate-900/90">
                      {couponRules}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-slate-950/85 pt-1">
                    💡 Copie a mensagem para enviar no WhatsApp ou baixe o cupom (válido por 24h até {validUntilText}).
                  </p>
                </div>
              </div>

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
        <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-5">
          <h2 className="text-lg font-black text-slate-900">Sobre a Empresa</h2>

          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {business.description}
          </p>

          {isAddressVisible && (fullAddressText || showLocationAction) && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF7A00] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Localização
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
                    {fullAddressText || "Caldas Novas - GO"}
                  </p>
                </div>
              </div>

              {showLocationAction && (
                <a
                  href={mapsDestinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0A4D9C] hover:bg-[#062F63] text-white font-extrabold text-xs px-4 py-2.5 rounded-xl inline-flex items-center justify-center gap-1.5 transition shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Ver Localização no Mapa
                </a>
              )}
            </div>
          )}

          {(business.instagram || business.website || showLocationAction) && (
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

              {showLocationAction && (
                <a
                  href={mapsDestinationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-800 px-4 py-2.5 rounded-xl transition"
                >
                  <MapPin className="w-4 h-4 text-[#FF7A00]" />
                  Como Chegar (Google Maps)
                </a>
              )}
            </div>
          )}
        </div>

        {/* HORÁRIO DE FUNCIONAMENTO */}
        {business.businessHours?.enabled && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0A4D9C]" />
                <h2 className="text-lg font-black text-slate-900">
                  Horário de Funcionamento
                </h2>
              </div>

              {openStatus.isOpen ? (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-extrabold px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {openStatus.label} {openStatus.detail ? `(${openStatus.detail})` : ""}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 text-xs font-extrabold px-3 py-1 rounded-full">
                  Fechado agora
                </span>
              )}
            </div>

            {business.businessHours.is24h ? (
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 text-sm font-extrabold text-emerald-900">
                ⏰ Atendimento 24 horas todos os dias da semana.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WEEK_DAYS.map((day) => {
                  const sched = business.businessHours?.days?.[day.key];
                  const isToday = day.key === todayKey;

                  return (
                    <div
                      key={day.key}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs sm:text-sm ${
                        isToday
                          ? "bg-blue-50/80 border-[#0A4D9C]/40 font-extrabold text-slate-900"
                          : "bg-slate-50 border-slate-200/70 text-slate-700 font-semibold"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {day.label}
                        {isToday && (
                          <span className="text-[10px] font-black uppercase bg-[#0A4D9C] text-white px-2 py-0.5 rounded-full">
                            Hoje
                          </span>
                        )}
                      </span>

                      {sched?.open ? (
                        <span className="text-slate-900 font-bold">
                          {sched.start} às {sched.end}
                        </span>
                      ) : (
                        <span className="text-red-600 font-bold">Fechado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* GALERIA DE FOTOS */}
        {galleryPhotos.length > 0 && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-4">
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
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VÍDEOS DO YOUTUBE (ASSINANTES) */}
        {(horizontalEmbed || verticalEmbeds.length > 0) && (
          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/80 space-y-5">
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
