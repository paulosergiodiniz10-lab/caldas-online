"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, ExternalLink } from "lucide-react";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { PromoBanner } from "@/types";

type ExtendedBanner = PromoBanner & {
  actionType?: "link" | "whatsapp";
  whatsappNumber?: string;
  whatsappMessage?: string;
  buttonText?: string;
};

interface BannerSliderProps {
  banners: ExtendedBanner[];
  categoryName?: string;
}

// Embaralhamento justo (Fisher-Yates) para banners com ordem = 0
function shuffleBanners<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function BannerSlider({ banners, categoryName }: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ordenação híbrida:
  // - order > 0 (1, 2, 3...): fixos na posição exata
  // - order === 0 (ou não definido): misturados aleatoriamente a cada acesso
  const orderedBanners = useMemo(() => {
    if (!banners || banners.length === 0) return [];

    const fixed = banners
      .filter((b) => typeof b.order === "number" && b.order > 0)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const randomPool = shuffleBanners(
      banners.filter((b) => !b.order || b.order <= 0)
    );

    return [...fixed, ...randomPool];
  }, [banners]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [orderedBanners.length]);

  useEffect(() => {
    if (orderedBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % orderedBanners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [orderedBanners]);

  // Pré-carrega em segundo plano apenas o próximo slide para transição instantânea sem pesar no 4G
  useEffect(() => {
    if (orderedBanners.length <= 1 || typeof window === "undefined") return;
    const nextIdx = (currentIndex + 1) % orderedBanners.length;
    const nextUrl = optimizeCloudinaryUrl(orderedBanners[nextIdx]?.imageUrl, 1200);
    if (!nextUrl) return;
    const img = new window.Image();
    img.src = nextUrl;
  }, [currentIndex, orderedBanners]);

  if (orderedBanners.length === 0) return null;

  const current = orderedBanners[currentIndex % orderedBanners.length];
  const optimizedBannerImage = optimizeCloudinaryUrl(current.imageUrl, 1200);

  const isWhatsapp =
    current.actionType === "whatsapp" ||
    Boolean(current.whatsappNumber && !current.linkUrl);

  const cleanWa = (current.whatsappNumber || "").replace(/\D/g, "");
  const waPhone = cleanWa.startsWith("55") ? cleanWa : `55${cleanWa}`;
  const waText =
    current.whatsappMessage?.trim() ||
    `Olá! Vi o anúncio "${current.title || "Promocional"}"${
      categoryName ? ` em ${categoryName}` : ""
    } no portal Caldas Novas Online e gostaria de mais informações.`;

  const targetHref = isWhatsapp
    ? cleanWa
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`
      : "#"
    : current.linkUrl || "#";

  const isExternal = targetHref.startsWith("http");
  const hasActionButton = Boolean((current.buttonText || isWhatsapp) && targetHref !== "#");

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(
      (prev) => (prev - 1 + orderedBanners.length) % orderedBanners.length
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % orderedBanners.length);
  };

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-white sm:bg-slate-900">
      <div className="relative w-full bg-slate-900">
        <a
          href={targetHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="block relative w-full"
        >
          <img
            src={optimizedBannerImage}
            alt={current.title || "Oferta em Destaque • Caldas Novas Online"}
            loading="eager"
            fetchPriority={currentIndex === 0 ? "high" : "auto"}
            decoding="async"
            className="w-full max-h-[240px] sm:max-h-[300px] object-cover transition duration-500"
          />
        </a>

        {/* Setas Sempre Visíveis (Home e Categorias, Mobile e Desktop) */}
        {orderedBanners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Banner anterior"
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-950/65 hover:bg-slate-950/90 text-white border border-white/25 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer z-20"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Próximo banner"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-950/65 hover:bg-slate-950/90 text-white border border-white/25 shadow-md flex items-center justify-center transition active:scale-95 cursor-pointer z-20"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </>
        )}

        {/* Indicadores (Bolinhas) sobre a base da imagem */}
        {orderedBanners.length > 1 && (
          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/50 px-2.5 py-1 rounded-full backdrop-blur-xs z-20">
            {orderedBanners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Ir para banner ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? "w-5 bg-[#FFB800]" : "w-1.5 bg-white/75"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Botão flutuante no canto inferior direito | Mobile: Barra limpa logo abaixo da arte */}
      {hasActionButton && (
        <a
          href={targetHref}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="block p-2.5 bg-white border-t border-slate-100 sm:p-0 sm:bg-transparent sm:border-0 sm:absolute sm:bottom-4 sm:right-4 z-20"
        >
          {isWhatsapp ? (
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full shadow-sm sm:shadow-lg transition">
              <MessageCircle className="w-4 h-4 fill-white shrink-0" />
              {current.buttonText || "Chamar no WhatsApp"}
            </span>
          ) : (
            <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#0A4D9C] sm:bg-white/95 hover:bg-[#062F63] sm:hover:bg-white text-white sm:text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full shadow-sm sm:shadow-lg transition">
              <span>{current.buttonText || "Saiba mais"}</span>
              <ExternalLink className="w-3.5 h-3.5 text-white sm:text-[#0A4D9C] shrink-0" />
            </span>
          )}
        </a>
      )}
    </div>
  );
}
