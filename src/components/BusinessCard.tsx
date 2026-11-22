"use client";

import Link from "next/link";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import { DEFAULT_CATEGORIES, getBusinessOpenStatus } from "@/lib/constants";
import { Business } from "@/types";
import {
  Ticket,
  MessageCircle,
  Building2,
  Star,
  BadgeCheck,
  MapPin,
} from "lucide-react";

type BusinessWithMaps = Business & {
  cep?: string;
  googleMapsUrl?: string;
};

interface BusinessCardProps {
  business: BusinessWithMaps;
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

  const fullAddressParts = [
    business.address,
    business.neighborhood ? `Bairro ${business.neighborhood}` : "",
    business.cep ? `CEP ${business.cep}` : "",
    "Caldas Novas - GO",
  ].filter(Boolean);

  const mapsUrl =
    business.googleMapsUrl && business.googleMapsUrl.trim()
      ? business.googleMapsUrl.trim()
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${business.name} ${fullAddressParts.join(", ")}`
        )}`;

  const categoryObj = DEFAULT_CATEGORIES.find(
    (c) => (c.slug || c.id) === business.category
  );
  const categoryLabel =
    categoryObj?.name || business.subcategory || business.category || "";

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
      className={`group rounded-2xl border shadow-sm hover:shadow-md transition overflow-hidden flex flex-col ${
        isClosedNow
          ? "bg-slate-50/70 border-slate-200/80"
          : "bg-white border-slate-200/70 hover:border-[#0A4D9C]/40"
      }`}
    >
      {/* FOTO LIMPA E VALORIZADA (APENAS BADGES DISCRETOS NO TOPO) */}
      <Link
        href={detailsHref}
        className="relative w-full h-48 bg-slate-100 overflow-hidden block"
      >
        {optimizedCardImage ? (
          <img
            src={optimizedCardImage}
            alt={business.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${
              isClosedNow ? "grayscale-[30%] opacity-90" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0A4D9C] to-[#062F63] flex items-center justify-center text-white/40">
            <Building2 className="w-12 h-12" />
          </div>
        )}

        {/* BADGES SUPERIORES LIMPOS */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          {business.isFeatured ? (
            <span className="inline-flex items-center gap-1 bg-[#FFB800] text-slate-950 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg shadow-sm">
              <Star className="w-3 h-3 fill-slate-950" /> Destaque
            </span>
          ) : hasCoupon ? (
            <span className="inline-flex items-center gap-1 bg-[#FF7A00] text-white text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg shadow-sm">
              <Ticket className="w-3 h-3" /> Cupom
            </span>
          ) : (
            <span />
          )}

          {hasCoupon && business.isFeatured ? (
            <span
              title="Cupom de Desconto Ativo"
              className="inline-flex items-center gap-1 bg-[#FF7A00] text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg shadow-sm"
            >
              <Ticket className="w-3 h-3" /> Cupom
            </span>
          ) : isVerified ? (
            <span
              title="Empresa Verificada"
              className="w-7 h-7 rounded-full bg-white/95 text-[#0A4D9C] flex items-center justify-center shadow-sm"
            >
              <BadgeCheck className="w-4 h-4" />
            </span>
          ) : null}
        </div>
      </Link>

      {/* CORPO ORGANIZADO DO CARD */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {/* NOME DA EMPRESA + SELO VERIFICADA */}
          <Link href={detailsHref} className="block group/title">
            <h3 className="text-[15px] sm:text-base font-black text-slate-900 group-hover/title:text-[#0A4D9C] leading-snug line-clamp-2">
              <span>{business.name}</span>
              {isVerified && (
                <span
                  title="Empresa Verificada"
                  className="inline-flex items-center align-middle ml-1"
                >
                  <BadgeCheck className="w-4 h-4 text-[#0A4D9C] fill-blue-50 inline" />
                </span>
              )}
            </h3>
          </Link>

          {/* NOME DA CATEGORIA (SEM O TEXTO "CATEGORIA") */}
          {categoryLabel && (
            <p className="text-xs font-semibold text-slate-500 line-clamp-1">
              {categoryLabel}
            </p>
          )}

          {/* BAIRRO / DISTÂNCIA */}
          <p className="text-[11px] font-medium text-slate-400 flex items-center gap-1 line-clamp-1 pt-0.5">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span>
              {business.neighborhood || "Caldas Novas"}
              {typeof distanceKm === "number"
                ? ` • ${distanceKm.toFixed(1).replace(".", ",")} km`
                : ""}
            </span>
          </p>

          {/* STATUS DE FUNCIONAMENTO (VERDE ABERTO / VERMELHO FECHADO) */}
          {openStatus.hasSchedule && (
            <div className="pt-0.5">
              {openStatus.isOpen ? (
                <p className="text-xs font-extrabold text-emerald-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">
                    {openStatus.label}
                    {openStatus.detail ? ` • ${openStatus.detail}` : ""}
                  </span>
                </p>
              ) : (
                <p className="text-xs font-extrabold text-red-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                  <span className="truncate">
                    {openStatus.label}
                    {openStatus.detail ? ` • ${openStatus.detail}` : ""}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* BOX DE CUPOM (IGUAL AO ATUAL) */}
          {hasCoupon && (
            <Link
              href={detailsHref}
              className="mt-2 block rounded-xl border border-dashed border-[#FF7A00] bg-orange-50/70 px-3 py-2 text-xs font-extrabold text-orange-800 hover:bg-orange-100/70 transition line-clamp-2"
            >
              🎟️ {business.coupon?.title || `Cupom: ${business.coupon?.code}`}
            </Link>
          )}
        </div>

        {/* BOTÕES NA BASE: VER PERFIL (TOPO) + WHATSAPP | LOCALIZAÇÃO */}
        <div className="pt-1 space-y-2">
          <Link
            href={detailsHref}
            className="w-full py-2 px-3 rounded-xl border border-[#0A4D9C] text-[#0A4D9C] hover:bg-[#0A4D9C] hover:text-white font-extrabold text-xs text-center block transition"
          >
            Ver perfil
          </Link>

          <div className={`grid gap-2 ${cleanPhone ? "grid-cols-2" : "grid-cols-1"}`}>
            {cleanPhone && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsappClick}
                className={`w-full py-2 px-2 rounded-xl font-extrabold text-[11px] inline-flex items-center justify-center gap-1 transition ${
                  isClosedNow
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    : "bg-[#1DB954] hover:bg-[#18a349] text-white shadow-2xs"
                }`}
              >
                <MessageCircle
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isClosedNow ? "text-slate-600" : "fill-white"
                  }`}
                />
                <span>WhatsApp</span>
              </a>
            )}

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 font-extrabold text-[11px] inline-flex items-center justify-center gap-1 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-[#FF7A00] shrink-0" />
              <span>Localização</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
