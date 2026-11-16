"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MessageCircle, ExternalLink } from "lucide-react";
import { PromoBanner } from "@/types";

type ExtendedBanner = PromoBanner & {
  actionType?: "link" | "whatsapp";
  whatsappNumber?: string;
  whatsappMessage?: string;
  buttonText?: string;
};

interface BannerSliderProps {
  banners: ExtendedBanner[];
}

export function BannerSlider({ banners }: BannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [banners]);

  if (!banners || banners.length === 0) return null;

  const current = banners[currentIndex % banners.length];

  const isWhatsapp =
    current.actionType === "whatsapp" ||
    Boolean(current.whatsappNumber && !current.linkUrl);

  const cleanWa = (current.whatsappNumber || "").replace(/\D/g, "");
  const waPhone = cleanWa.startsWith("55") ? cleanWa : `55${cleanWa}`;
  const waText =
    current.whatsappMessage?.trim() ||
    `Olá! Vi o anúncio "${current.title || "Promocional"}" no portal Caldas Online e gostaria de mais informações.`;

  const targetHref = isWhatsapp
    ? cleanWa
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`
      : "#"
    : current.linkUrl || "#";

  const isExternal = targetHref.startsWith("http");

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-sm border border-slate-200/70 bg-slate-900 group">
      <a
        href={targetHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="block relative w-full"
      >
        <img
          src={current.imageUrl}
          alt={current.title || "Oferta em Destaque • Caldas Online"}
          className="w-full max-h-[240px] sm:max-h-[300px] object-cover transition duration-500"
        />

        {/* Botão de Ação Discreto e Clean no Canto Inferior Direito (quando configurado) */}
        {(current.buttonText || isWhatsapp) && targetHref !== "#" && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
            {isWhatsapp ? (
              <span className="inline-flex items-center gap-1.5 bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-full shadow-lg transition">
                <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                {current.buttonText || "Chamar no WhatsApp"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-white/95 hover:bg-white text-slate-950 font-extrabold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-full shadow-lg transition">
                <span>{current.buttonText || "Saiba mais"}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#0A4D9C] shrink-0" />
              </span>
            )}
          </div>
        )}
      </a>

      {/* Setas de Navegação (aparecem se houver mais de 1 banner) */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Banner anterior"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/55 hover:bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Próximo banner"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-950/55 hover:bg-slate-950/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicadores (Bolinhas) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir para banner ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? "w-5 bg-[#FFB800]" : "w-1.5 bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
