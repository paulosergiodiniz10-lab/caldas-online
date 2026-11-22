"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Flame,
  Megaphone,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  X,
} from "lucide-react";
import { SiteSettings, UtilityDoc } from "@/types";
import { DEFAULT_SITE_SETTINGS, DEFAULT_UTILITIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/CategoryIcon";

interface FooterProps {
  settings?: Partial<SiteSettings>;
  vipGroupUrl?: string;
  masterWhatsApp?: string;
}

export function Footer({ settings, vipGroupUrl, masterWhatsApp }: FooterProps) {
  const [showUtilitiesModal, setShowUtilitiesModal] = useState(false);
  const [utilities, setUtilities] = useState<UtilityDoc[]>(DEFAULT_UTILITIES);

  const cfg: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...(settings || {}),
    ...(vipGroupUrl ? { vipGroupUrl } : {}),
    ...(masterWhatsApp ? { masterWhatsApp } : {}),
  };

  useEffect(() => {
    let isMounted = true;
    async function loadUtilities() {
      try {
        const snapUtils = await getDocs(collection(db, "utilities"));
        if (!snapUtils.empty && isMounted) {
          const list = snapUtils.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<UtilityDoc, "id">) }))
            .filter((u) => u.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (list.length > 0) {
            setUtilities(list);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar utilidades no rodapé:", err);
      }
    }
    loadUtilities();
    return () => {
      isMounted = false;
    };
  }, []);

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
    <>
      <footer className="mt-12 space-y-6 pb-8">
        <div className="max-w-6xl mx-auto px-4 space-y-5">
          {/* BANNER 1: CLUBE EXCLUSIVO / GRUPO VIP (VERDE ESMERALDA VIP) */}
          <div className="rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#047857] to-[#059669] p-6 sm:p-8 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
            <div className="space-y-2 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 bg-slate-950/60 text-[#FFB800] border border-white/15 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-[#FFB800]" />
                {cfg.vipGroupBadge}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {cfg.vipGroupTitle}
              </h2>
              <p className="text-sm text-emerald-50/90 font-medium leading-relaxed">
                {cfg.vipGroupSubtitle}
              </p>
            </div>

            <a
              href={resolveVipHref()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white hover:bg-emerald-50 text-[#064E3B] font-extrabold text-xs sm:text-sm px-6 py-4 rounded-2xl shadow-lg inline-flex items-center gap-2.5 transition shrink-0 w-full md:w-auto justify-center"
            >
              <MessageCircle className="w-5 h-5 text-[#1DB954] fill-[#1DB954]" />
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

          {/* FAIXA DE UTILIDADES PÚBLICAS & TELEFONES ÚTEIS */}
          <div className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {cfg.utilitiesTitle || "Utilidades Públicas & Emergências"}
                </h3>
                <p className="text-xs text-slate-500">
                  Polícia Militar, Bombeiros, SAMU, UPA, Prefeitura, Saneamento e Energia em Caldas Novas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUtilitiesModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-xs inline-flex items-center gap-2 transition cursor-pointer shrink-0 w-full sm:w-auto justify-center"
            >
              <PhoneCall className="w-4 h-4" />
              Ver Telefones Úteis ({utilities.length})
            </button>
          </div>
        </div>

        {/* RODAPÉ INSTITUCIONAL COM ACESSO MASTER DISCRETO */}
        <div className="max-w-6xl mx-auto px-4 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p className="font-semibold text-center sm:text-left">
            © {new Date().getFullYear()} Caldas Novas Online • O Guia Comercial de Caldas Novas - GO
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowUtilitiesModal(true)}
              className="hover:text-indigo-600 font-semibold cursor-pointer"
            >
              Utilidades Públicas
            </button>
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

      {/* POP-UP COMPLETO DE UTILIDADES PÚBLICAS */}
      {showUtilitiesModal && (
        <div
          onClick={() => setShowUtilitiesModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="bg-[#0A4D9C] text-white p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-[#FFB800]" />
                </div>
                <div>
                  <h3 className="text-lg font-black leading-tight">
                    {cfg.utilitiesTitle || "Utilidades Públicas"}
                  </h3>
                  <p className="text-xs text-blue-100">
                    {cfg.utilitiesSubtitle ||
                      "Toque no serviço desejado para ligar diretamente"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowUtilitiesModal(false)}
                aria-label="Fechar"
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {utilities.map((util) => (
                <a
                  key={util.id}
                  href={`tel:${util.number.replace(/\D/g, "")}`}
                  className="bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-[#0A4D9C]/40 rounded-2xl p-3.5 flex flex-col items-center text-center shadow-2xs transition group"
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${util.color} text-white flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <CategoryIcon
                      name={util.iconName}
                      customIconUrl={util.customIconUrl}
                      className="w-5 h-5 text-white"
                    />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 leading-tight">
                    {util.name}
                  </span>
                  <span className="mt-1.5 inline-flex items-center gap-1 bg-white border border-red-200 text-red-600 text-xs font-black px-2.5 py-1 rounded-full">
                    <PhoneCall className="w-3 h-3" />
                    {util.number}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Footer;
