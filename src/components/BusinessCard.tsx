"use client";

import Link from "next/link";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Business } from "@/types";
import {
  Ticket,
  MessageCircle,
  ChevronRight,
  Building2,
  Star,
} from "lucide-react";

interface BusinessCardProps {
  business: Business;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const slugOrId = business.slug || business.id;
  const detailsHref = `/empresa/${slugOrId}`;

  const cleanPhone = (business.whatsapp || "").replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const waMessage = `Olá! Vi a *${business.name}* no guia *Caldas Online* e gostaria de mais informações.`;
  const waUrl = cleanPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : "#";

  const hasCoupon = Boolean(
    business.coupon?.active &&
      (business.coupon?.title || business.coupon?.code)
  );

  const handleWhatsappClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    if (business.id) {
      updateDoc(doc(db, "businesses", business.id), {
        whatsappClicks: increment(1),
      }).catch(() => {});
    }
  };

  return (
    <div className="group bg-white rounded-3xl border border-slate-100 hover:border-[#0A4D9C]/30 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
      {/* IMAGEM SUPERIOR CLICÁVEL PARA DETALHES */}
      <Link
        href={detailsHref}
        className="relative w-full h-44 bg-slate-100 overflow-hidden block"
      >
        {business.coverUrl || business.logoUrl || business.gallery?.[0] ? (
          <img
            src={business.coverUrl || business.gallery?.[0] || business.logoUrl}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0A4D9C] to-[#062F63] flex items-center justify-center text-white/40">
            <Building2 className="w-12 h-12" />
          </div>
        )}

        {/* BADGES SUPERIORES */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          {hasCoupon ? (
            <span className="inline-flex items-center gap-1 bg-[#FF7A00] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow">
              <Ticket className="w-3 h-3" /> Cupom Ativo
            </span>
          ) : (
            <span />
          )}

          {business.isFeatured && (
            <span className="inline-flex items-center gap-1 bg-slate-950/80 text-[#FFB800] text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full backdrop-blur-xs">
              <Star className="w-3 h-3 fill-[#FFB800]" /> Destaque
            </span>
          )}
        </div>
      </Link>

      {/* CORPO DO CARD */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-1.5">
          {/* TÍTULO + INDICADOR "VER MAIS ›" */}
          <Link
            href={detailsHref}
            className="flex items-start justify-between gap-2 group/title"
          >
            <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover/title:text-[#0A4D9C] leading-snug line-clamp-1">
              {business.name}
            </h3>

            <span className="inline-flex items-center gap-0.5 bg-blue-50 group-hover:bg-[#0A4D9C] text-[#0A4D9C] group-hover:text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0 transition">
              Ver mais
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href={detailsHref} className="block">
            <p className="text-xs font-semibold text-slate-500 line-clamp-1">
              {business.subcategory ? `${business.subcategory} • ` : ""}
              {business.neighborhood || "Caldas Novas"}
            </p>
          </Link>

          {hasCoupon && (
            <Link
              href={detailsHref}
              className="mt-2 block rounded-xl border border-dashed border-[#FF7A00] bg-orange-50/70 px-3 py-2 text-xs font-extrabold text-orange-800 hover:bg-orange-100/70 transition line-clamp-1"
            >
              🎟️ {business.coupon?.title || `Cupom: ${business.coupon?.code}`}
            </Link>
          )}
        </div>

        {/* BOTÃO DIRETO WHATSAPP */}
        {cleanPhone && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsappClick}
            className="w-full bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl shadow-xs inline-flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
