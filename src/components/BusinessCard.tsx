"use client";

import Link from "next/link";
import { MapPin, Ticket, Star, MessageCircle } from "lucide-react";
import { Business } from "@/types";
import { formatDistance } from "@/lib/constants";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Props {
  business: Business;
  distanceKm?: number | null;
}

export function BusinessCard({ business, distanceKm }: Props) {
  const cleanPhone = business.whatsapp.replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
    `Olá ${business.name}! Vi vocês no Guia Caldas Online e gostaria de mais informações.`
  )}`;

  const handleWhatsAppClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const ref = doc(db, "businesses", business.id);
      await updateDoc(ref, { whatsappClicks: increment(1) });
    } catch {
      // Ignora erro caso seja mock inicial
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border flex flex-col justify-between ${
        business.isFeatured ? "border-amber-400 ring-1 ring-amber-200" : "border-slate-100"
      }`}
    >
      <Link href={`/empresa/${business.slug}`} className="block group">
        {/* Capa da Empresa */}
        <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
          <img
            src={
              business.coverUrl ||
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
            }
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Badges superiores */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            {business.coupon?.active ? (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow">
                <Ticket className="w-3.5 h-3.5" /> CUPOM ATIVO
              </span>
            ) : (
              <span />
            )}

            {business.isFeatured && (
              <span className="inline-flex items-center gap-1 bg-[#FFB800] text-slate-950 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow">
                <Star className="w-3 h-3 fill-slate-950" /> Destaque
              </span>
            )}
          </div>

          {/* Badge de Distância GPS */}
          {typeof distanceKm === "number" && (
            <div className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
              <MapPin className="w-3 h-3 text-orange-400" />
              {formatDistance(distanceKm)}
            </div>
          )}
        </div>

        {/* Informações da Empresa */}
        <div className="p-3.5 pb-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-[#0A4D9C] transition-colors">
              {business.name}
            </h3>
          </div>

          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {business.subcategory ? `${business.subcategory} • ` : ""}
            {business.neighborhood || "Caldas Novas - GO"}
          </p>

          {business.coupon?.active && (
            <div className="mt-2 bg-orange-50 border border-dashed border-orange-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-orange-700 line-clamp-1">
              🎟️ {business.coupon.title}
            </div>
          )}
        </div>
      </Link>

      {/* Botão WhatsApp Direto */}
      <div className="p-3.5 pt-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="w-full bg-[#1DB954] hover:bg-[#18a349] text-white font-bold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          WhatsApp
        </a>
      </div>
    </div>
  );
}
