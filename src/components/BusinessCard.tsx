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
  MapPin,
  Check,
} from "lucide-react";

type BusinessWithMaps = Business & {
  cep?: string;
  googleMapsUrl?: string;
};

interface BusinessCardProps {
  business: BusinessWithMaps;
  distanceKm?: number | null;
}

// Selo Verificada estilo Meta (círculo azul sólido com check branco)
function MetaVerifiedBadge({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <span
      title="Empresa Verificada"
      className={`inline-flex items-center justify-center rounded-full bg-[#1877F2] text-white shadow-2xs shrink-0 ${className}`}
    >
      <Check className="w-[68%] h-[68%] stroke-[3.5]" />
    </span>
  );
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

  const hasGoogleMapsLink = Boolean(
    business.googleMapsUrl && business.googleMapsUrl.trim()
  );
  const hasCoordinates =
    typeof business.lat === "number" && typeof business.lng === "number";
  const hasStreetAddress = Boolean(business.address && business.address.trim());
  const hasLocation = hasGoogleMapsLink || hasCoordinates || hasStreetAddress;

  const fullAddressParts = [
    business.address,
    business.neighborhood ? `Bairro ${business.neighborhood}` : "",
    business.cep ? `CEP ${business.cep}` : "",
    "Caldas Novas - GO",
  ].filter(Boolean);

  const mapsUrl = hasGoogleMapsLink
    ? business.googleMapsUrl!.trim()
    : hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${business.lat},${business.lng}`
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

  // Prioriza Foto Vitrine (showcaseUrl), depois 1ª foto da galeria, capa ou logo
  const rawCardImage =
    business.showcaseUrl ||
    business.gallery?.[0] ||
    business.coverUrl ||
    business.logoUrl;
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
          ? "bg-slate-50/80 border-slate-300"
          : "bg-white border-slate-300/90 hover:border-[#0A4D9C]/60"
      }`}
    >
      {/* FOTO VITRINE LIMPA E PROPORCIONAL (4:3) */}
      <Link
        href={detailsHref}
        className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden block"
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

          {hasCoupon && business.isFeatured && (
            <span
              title="Cupom de Desconto Ativo"
              className="inline-flex items-center gap-1 bg-[#FF7A00] text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg shadow-sm"
            >
              <Ticket className="w-3 h-3" /> Cupom
            </span>
          )}
        </div>
      </Link>

      {/* CORPO ORGANIZADO DO CARD */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          {/* NOME DA EMPRESA + SELO VERIFICADA ESTILO META */}
          <Link href={detailsHref} className="block group/title">
            <h3 className="text-[15px] sm:text-base font-black text-slate-900 group-hover/title:text-[#0A4D9C] leading-snug line-clamp-2">
              <span>{business.name}</span>
              {isVerified && (
                <span className="inline-flex items-center align-middle ml-1.5 -mt-0.5">
                  <MetaVerifiedBadge className="w-4 h-4" />
                </span>
              )}
            </h3>
          </Link>

          {/* NOME DA CATEGORIA (E DISTÂNCIA APENAS QUANDO GPS ESTIVER ATIVO) */}
          {(categoryLabel || typeof distanceKm === "number") && (
            <p className="text-xs font-semibold text-slate-500 line-clamp-1">
              {categoryLabel}
              {typeof distanceKm === "number"
                ? `${categoryLabel ? " • " : ""}${distanceKm
                    .toFixed(1)
                    .replace(".", ",")} km`
                : ""}
            </p>
          )}

          {/* STATUS DE FUNCIONAMENTO ENXUTO */}
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
                  <span>Fechado agora</span>
                </p>
              )}
            </div>
          )}

          {/* BOX DE CUPOM */}
          {hasCoupon && (
            <Link
              href={detailsHref}
              className="mt-2 block rounded-xl border border-dashed border-[#FF7A00] bg-orange-50/70 px-3 py-2 text-xs font-extrabold text-orange-800 hover:bg-orange-100/70 transition line-clamp-2"
            >
              🎟️ {business.coupon?.title || `Cupom: ${business.coupon?.code}`}
            </Link>
          )}
        </div>

        {/* BOTÕES NA BASE: VER PERFIL + WHATSAPP (E LOCALIZAÇÃO SE CADASTRADA) */}
        <div className="pt-1 space-y-2">
          <Link
            href={detailsHref}
            className="w-full py-2 px-3 rounded-xl border border-[#0A4D9C] text-[#0A4D9C] hover:bg-[#0A4D9C] hover:text-white font-extrabold text-xs text-center block transition"
          >
            Ver perfil
          </Link>

          {(cleanPhone || hasLocation) && (
            <div
              className={`grid gap-2 ${
                cleanPhone && hasLocation ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {cleanPhone && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleWhatsappClick}
                  className={`w-full py-2 px-2 rounded-xl font-extrabold text-[11px] inline-flex items-center justify-center gap-1 transition ${
                    isClosedNow
                      ? "bg-slate-200/80 hover:bg-slate-300 text-slate-700 border border-slate-300"
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

              {hasLocation && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300/80 font-extrabold text-[11px] inline-flex items-center justify-center gap-1 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FF7A00] shrink-0" />
                  <span>Localização</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
