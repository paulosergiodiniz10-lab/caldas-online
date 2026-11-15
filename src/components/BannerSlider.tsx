"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { PromoBanner } from "@/types";
import Link from "next/link";

interface Props {
  banners: PromoBanner[];
  categoryName?: string;
}

export function BannerSlider({ banners, categoryName }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) {
    return (
      <Link
        href="/painel-empresa"
        className="block w-full rounded-2xl bg-gradient-to-r from-[#0A4D9C] via-[#0d62c7] to-[#FF7A00] p-5 md:p-7 text-white shadow-md hover:shadow-lg transition-all relative overflow-hidden group"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full mb-2">
              <Megaphone className="w-3.5 h-3.5" /> Espaço Destaque {categoryName ? `• ${categoryName}` : ""}
            </span>
            <h3 className="text-xl md:text-2xl font-extrabold leading-tight">
              Sua empresa no topo de Caldas Novas!
            </h3>
            <p className="text-sm text-blue-100 mt-1">
              Apareça para milhares de moradores e turistas todos os dias. Cadastre-se grátis ou reserve este banner.
            </p>
          </div>
          <span className="bg-[#FFB800] text-slate-900 font-extrabold text-sm px-5 py-3 rounded-xl shadow group-hover:scale-105 transition-transform whitespace-nowrap">
            ANUNCIAR AGORA
          </span>
        </div>
      </Link>
    );
  }

  const prevSlide = () =>
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  const nextSlide = () => setCurrent((prev) => (prev + 1) % banners.length);

  const activeBanner = banners[current];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-md bg-slate-200 aspect-[21/9] md:aspect-[24/7] group">
      <a
        href={activeBanner.linkUrl || "#"}
        target={activeBanner.linkUrl?.startsWith("http") ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className="block w-full h-full"
      >
        <img
          src={activeBanner.imageUrl}
          alt={activeBanner.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
        />
      </a>

      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Banner anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-md transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Próximo banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-slate-800 p-2 rounded-full shadow-md transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === current ? "w-6 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
