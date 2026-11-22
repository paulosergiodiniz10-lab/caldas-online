"use client";

import Link from "next/link";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { getBusinessOpenStatus } from "@/lib/constants";
import { Business } from "@/types";
import {
  Ticket,
  MessageCircle,
  ChevronRight,
  Building2,
  Star,
  BadgeCheck,
  Clock,
} from "lucide-react";

interface BusinessCardProps {
  business: Business;
  distanceKm?: number | null;
}

export function BusinessCard({ business, distanceKm }: BusinessCardProps) {
  const slugOrId = business.slug || business.id;
  const detailsHref = `/empresa/${slugOrId}`;

  const cleanPhone = (business.whatsapp || "").replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const waMessage = `Olá! Vi a *${business.name}* no guia *Caldas Novas Online* e gostaria de mais informações.`;
  const waUrl = cleanPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : "#";

  const hasCoupon = Boolean(
    business.coupon?.active &&
      (business.coupon?.title || business.coupon?.code)
  );

  const openStatus = getBusinessOpenStatus(business.businessHours);
  const isClosedNow = openStatus.hasSchedule && !openStatus.isOpen;
  const isVerified = business.isVerified !== false;

  const rawCardImage =
    business.coverUrl || business.gallery?.[0] || business.logoUrl;
  const optimizedCardImage = optimizeCloudinaryUrl(rawCardImage);

  const handleWhatsappClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    if (business.id) {
      updateDoc(doc(db, "businesses", business.id), {
        whatsappClicks: increment(1),
      }).catch(() => {});
    }
  };

  return (
    <div
      className={`group rounded-3xl border shadow-sm hover:shadow-md transition overflow-hidden flex flex-col ${
        isClosedNow
          ? "bg-slate-50/90 border-slate-200/80"
          : "bg-white border-slate-100 hover:border-[#0A4D9C]/30"
      }`}
    >
      {/* IMAGEM SUPERIOR CLICÁVEL PARA DETALHES */}
      <Link
        href={detailsHref}
        className="relative w-full h-44 bg-slate-100 overflow-hidden block"
      >
        {optimizedCardImage ? (
          <img
            src={optimizedCardImage}
            alt={business.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${
              isClosedNow ? "grayscale-[45%] opacity-80" : ""
            }`}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br from-[#0A4D9C] to-[#062F63] flex items-center justify-center text-white/40 ${
              isClosedNow ? "grayscale-[45%] opacity-80" : ""
            }`}
          >
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

        {/* BADGE INFERIOR DE HORÁRIO (ABERTO OU FECHADO AGORA) */}
        {openStatus.hasSchedule && (
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
            {openStatus.isOpen ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-600/95 text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shadow backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                {openStatus.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-red-600/95 text-white text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full shadow backdrop-blur-xs">
                <Clock className="w-3 h-3" />
                {openStatus.label}
              </span>
            )}

            {openStatus.detail && (
              <span className="bg-slate-950/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-xs truncate">
                {openStatus.detail}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* CORPO DO CARD */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-1.5">
          {/* TÍTULO + SELO VERIFICADA */}
          <Link href={detailsHref} className="block group/title">
            <h3
              className={`text-base sm:text-lg font-black leading-snug line-clamp-2 ${
                isClosedNow
                  ? "text-slate-600 group-hover/title:text-[#0A4D9C]"
                  : "text-slate-900 group-hover/title:text-[#0A4D9C]"
              }`}
            >
              <span>{business.name}</span>
              {isVerified && (
                <span
                  title="Empresa Verificada no Guia"
                  className="inline-flex items-center align-middle ml-1.5"
                >
                  <BadgeCheck className="w-4 h-4 text-[#0A4D9C] fill-blue-50 inline" />
                </span>
              )}
            </h3>
          </Link>

          <Link href={detailsHref} className="block">
            <p className="text-xs font-semibold text-slate-500 line-clamp-1">
              {business.subcategory ? `${business.subcategory} • ` : ""}
              {business.neighborhood || "Caldas Novas"}
              {typeof distanceKm === "number" ? ` • ${distanceKm.toFixed(1)} km` : ""}
            </p>
          </Link>

          {hasCoupon && (
            <Link
              href={detailsHref}
              className={`mt-2 block rounded-xl border border-dashed px-3 py-2 text-xs font-extrabold transition line-clamp-2 ${
                isClosedNow
                  ? "border-slate-300 bg-slate-100 text-slate-600"
                  : "border-[#FF7A00] bg-orange-50/70 text-orange-800 hover:bg-orange-100/70"
              }`}
            >
              🎟️ {business.coupon?.title || `Cupom: ${business.coupon?.code}`}
            </Link>
          )}
        </div>

        {/* DOIS BOTÕES LADO A LADO NA BASE: WHATSAPP | VER MAIS */}
        <div className={`grid gap-2 ${cleanPhone ? "grid-cols-2" : "grid-cols-1"}`}>
          {cleanPhone && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsappClick}
              className={`w-full font-extrabold text-xs py-3 px-2 rounded-xl shadow-xs inline-flex items-center justify-center gap-1.5 transition ${
                isClosedNow
                  ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  : "bg-[#1DB954] hover:bg-[#18a349] text-white"
              }`}
            >
              <MessageCircle
                className={`w-4 h-4 shrink-0 ${
                  isClosedNow ? "text-slate-600" : "fill-white"
                }`}
              />
              <span>WhatsApp</span>
            </a>
          )}

          <Link
            href={detailsHref}
            className="w-full bg-blue-50 hover:bg-[#0A4D9C] text-[#0A4D9C] hover:text-white font-extrabold text-xs py-3 px-2 rounded-xl inline-flex items-center justify-center gap-1 transition"
          >
            <span>Ver mais</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
