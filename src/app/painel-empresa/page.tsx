"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_PLANS, DEFAULT_SITE_SETTINGS } from "@/lib/constants";
import { PlanDoc, SiteSettings } from "@/types";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  CheckCircle2,
  MessageCircle,
  Star,
  Image as ImageIcon,
  Youtube,
  Megaphone,
  Sparkles,
  Loader2,
  ArrowRight,
} from "lucide-react";

function formatBRL(value: number): string {
  if (!value || value <= 0) return "Grátis";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function PublicPlansPage() {
  const [plans, setPlans] = useState<PlanDoc[]>(DEFAULT_PLANS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlansAndSettings() {
      try {
        const snapPlans = await getDocs(collection(db, "plans"));
        if (!snapPlans.empty) {
          const list = snapPlans.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<PlanDoc, "id">) }))
            .filter((p) => p.active !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          if (list.length > 0) setPlans(list);
        }

        const snapSet = await getDoc(doc(db, "settings", "global"));
        if (snapSet.exists()) {
          setSettings((prev) => ({
            ...prev,
            ...(snapSet.data() as Partial<SiteSettings>),
          }));
        }
      } catch (err) {
        console.error("Erro ao carregar planos:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPlansAndSettings();
  }, []);

  const cleanMasterPhone = (settings.masterWhatsApp || "5564993049090").replace(
    /\D/g,
    ""
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        vipGroupUrl={settings.vipGroupUrl}
        masterWhatsApp={settings.masterWhatsApp}
      />

      {/* HERO COMERCIAL */}
      <section className="bg-gradient-to-b from-[#0A4D9C] to-[#062F63] text-white py-10 sm:py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-[#FFB800] text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Planos de Divulgação • Caldas Novas Online
          </span>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
            Coloque sua empresa na frente de{" "}
            <span className="text-[#FFB800]">moradores e turistas</span>
          </h1>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto">
            Comece gratuitamente ou escolha um plano de visibilidade para exibir mais fotos, vídeos e aparecer no topo do guia comercial de Caldas Novas.
          </p>
        </div>
      </section>

      <main className="max-w-6xl w-full mx-auto px-4 -mt-6 pb-14 flex-1 space-y-10">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0A4D9C]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {plans.map((plan) => {
              const isFree = !plan.price || plan.price <= 0;
              const waMessage = `Olá! Vi os planos no portal *Caldas Novas Online* e tenho interesse no plano *${plan.name}* (${formatBRL(
                plan.price
              )}). Gostaria de saber como ativar para minha empresa!`;
              const waUrl = `https://wa.me/${cleanMasterPhone}?text=${encodeURIComponent(
                waMessage
              )}`;

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl bg-white flex flex-col justify-between p-6 transition relative ${
                    plan.highlight
                      ? "border-2 border-[#FF7A00] shadow-xl lg:-translate-y-2"
                      : "border border-slate-200/90 shadow-sm"
                  }`}
                >
                  {plan.badgeText && (
                    <span
                      className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm whitespace-nowrap ${
                        plan.highlight
                          ? "bg-[#FF7A00] text-slate-950"
                          : "bg-slate-900 text-[#FFB800]"
                      }`}
                    >
                      {plan.badgeText}
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-900">
                        {plan.name}
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {plan.subtitle}
                      </p>
                    </div>

                    <div className="pt-2 pb-3 border-b border-slate-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-950">
                          {formatBRL(plan.price)}
                        </span>
                        {!isFree && (
                          <span className="text-xs font-bold text-slate-500">
                            {plan.billingPeriod || "/mês"}
                          </span>
                        )}
                      </div>
                      {isFree && (
                        <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                          {plan.billingPeriod || "Sem mensalidade"}
                        </p>
                      )}
                    </div>

                    {/* Recursos Estruturados do Plano */}
                    <ul className="space-y-2.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2 font-bold text-slate-900">
                        <ImageIcon className="w-4 h-4 text-[#0A4D9C] shrink-0 mt-0.5" />
                        <span>Até {plan.maxPhotos} fotos na galeria</span>
                      </li>

                      <li className="flex items-start gap-2 font-bold text-slate-900">
                        <Youtube className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <span>
                          {plan.maxVideos > 0
                            ? `Até ${plan.maxVideos} vídeo(s) do YouTube/Reels`
                            : "Sem vídeos (apenas fotos)"}
                        </span>
                      </li>

                      {plan.hasFeaturedHome && (
                        <li className="flex items-start gap-2 font-extrabold text-amber-800 bg-amber-50 p-2 rounded-xl">
                          <Star className="w-4 h-4 text-[#FFB800] fill-[#FFB800] shrink-0 mt-0.5" />
                          <span>Empresas em Destaque na Primeira Página</span>
                        </li>
                      )}

                      {plan.hasBannerHome && (
                        <li className="flex items-start gap-2 font-extrabold text-[#0A4D9C] bg-blue-50 p-2 rounded-xl">
                          <Megaphone className="w-4 h-4 text-[#0A4D9C] shrink-0 mt-0.5" />
                          <span>Full Banner no topo da Página Inicial</span>
                        </li>
                      )}

                      {plan.hasBannerSegment && (
                        <li className="flex items-start gap-2 font-extrabold text-[#0A4D9C] bg-blue-50 p-2 rounded-xl">
                          <Megaphone className="w-4 h-4 text-[#FF7A00] shrink-0 mt-0.5" />
                          <span>Full Banner exclusivo no seu Segmento</span>
                        </li>
                      )}

                      {(plan.features || []).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100">
                    {isFree ? (
                      <Link
                        href="/painel-empresa"
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 transition"
                      >
                        <span>{plan.buttonText || "Cadastrar Grátis"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full font-extrabold text-xs py-3.5 px-4 rounded-xl inline-flex items-center justify-center gap-1.5 shadow-sm transition ${
                          plan.highlight
                            ? "bg-[#1DB954] hover:bg-[#18a349] text-white"
                            : "bg-[#0A4D9C] hover:bg-[#062F63] text-white"
                        }`}
                      >
                        <MessageCircle className="w-4 h-4 fill-white shrink-0" />
                        <span>{plan.buttonText || "Contratar no WhatsApp"}</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rodapé de Dúvidas / Atendimento Personalizado */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-black text-slate-900">
              Precisa de um pacote personalizado ou banner avulso?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Fale diretamente com nossa equipe comercial em Caldas Novas e monte a melhor estratégia para o seu negócio.
            </p>
          </div>
          <a
            href={`https://wa.me/${cleanMasterPhone}?text=${encodeURIComponent(
              "Olá! Vi a página de planos do Caldas Novas Online e gostaria de tirar uma dúvida."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-2xl inline-flex items-center gap-2 shadow-sm shrink-0 transition"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            Falar no WhatsApp
          </a>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
