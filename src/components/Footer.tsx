"use client";

import Link from "next/link";
import { Flame, Megaphone, MessageCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { SiteSettings } from "@/types";
import { DEFAULT_SITE_SETTINGS } from "@/lib/constants";

interface FooterProps {
  settings?: Partial<SiteSettings>;
  vipGroupUrl?: string;
  masterWhatsApp?: string;
}

export function Footer({ settings, vipGroupUrl, masterWhatsApp }: FooterProps) {
  const cfg: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...(settings || {}),
    ...(vipGroupUrl ? { vipGroupUrl } : {}),
    ...(masterWhatsApp ? { masterWhatsApp } : {}),
  };

  const cleanMasterPhone = (cfg.masterWhatsApp || "5564993049090").replace(/\D/g, "");
  const advertiseWaUrl = `https://wa.me/${cleanMasterPhone}?text=${encodeURIComponent(
    cfg.advertiseWhatsappMessage || ""
  )}`;

  const resolveVipHref = () => {
    const raw = (cfg.vipGroupUrl || "").trim();
    if (!raw || raw === "https://chat.whatsapp.com/") {
      return `https://wa.me/${cleanMasterPhone}?text=${encodeURIComponent(
        cfg.vipGroupMessage || ""
      )}`;
    }
    if (/^\d+$/.test(raw.replace(/\D/g, "")) && !raw.startsWith("http")) {
      return `https://wa.me/${raw.replace(/\D/g, "")}?text=${encodeURIComponent(
        cfg.vipGroupMessage || ""
      )}`;
    }
    return raw;
  };

  const isExternalRegister = (cfg.advertiseRegisterUrl || "").startsWith("http");

  return (
    <footer className="mt-12 space-y-6 pb-8">
      <div className="max-w-6xl mx-auto px-4 space-y-5">
        {/* BANNER 1: CLUBE EXCLUSIVO / GRUPO VIP */}
        <div className="rounded-3xl bg-gradient-to-r from-[#FF7A00] via-orange-500 to-[#FFB800] p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-slate-950 text-[#FFB800] text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 fill-[#FFB800]" />
              {cfg.vipGroupBadge}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 leading-tight">
              {cfg.vipGroupTitle}
            </h2>
            <p className="text-sm text-slate-900/90 font-medium leading-relaxed">
              {cfg.vipGroupSubtitle}
            </p>
          </div>

          <a
            href={resolveVipHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm px-6 py-4 rounded-2xl shadow-lg inline-flex items-center gap-2.5 transition shrink-0 w-full md:w-auto justify-center"
          >
            <MessageCircle className="w-5 h-5 text-[#25D366]" />
            {cfg.vipGroupButtonText}
          </a>
        </div>

        {/* BANNER 2: ANUNCIE NO CALDAS NOVAS ONLINE */}
        <div className="rounded-3xl bg-[#0A4D9C] p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-[#FFB800] flex items-center justify-center shrink-0 mt-0.5">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                {cfg.advertiseTitle}
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed">
                {cfg.advertiseSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
            {isExternalRegister ? (
              <a
                href={cfg.advertiseRegisterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-blue-50 text-[#0A4D9C] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow inline-flex items-center justify-center gap-2 transition"
              >
                {cfg.advertiseRegisterText}
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href={cfg.advertiseRegisterUrl || "/painel-empresa"}
                className="bg-white hover:bg-blue-50 text-[#0A4D9C] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow inline-flex items-center justify-center gap-2 transition"
              >
                {cfg.advertiseRegisterText}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <a
              href={advertiseWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow inline-flex items-center justify-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              {cfg.advertiseWhatsappText}
            </a>
          </div>
        </div>
      </div>

      {/* RODAPÉ INSTITUCIONAL COM ACESSO MASTER DISCRETO */}
      <div className="max-w-6xl mx-auto px-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <p className="font-semibold text-center sm:text-left">
          © {new Date().getFullYear()} Caldas Novas Online • O Guia Comercial de Caldas Novas - GO
        </p>
        <div className="flex items-center gap-4">
          <Link href="/planos" className="hover:text-[#0A4D9C] font-semibold">
            Planos e Anúncios
          </Link>
          <Link href="/painel-empresa" className="hover:text-[#0A4D9C] font-semibold">
            Área do Lojista
          </Link>
          <Link
            href="/master"
            title="Acesso Administrativo"
            aria-label="Acesso Administrativo"
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
