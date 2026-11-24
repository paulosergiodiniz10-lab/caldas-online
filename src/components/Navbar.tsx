"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, User, Menu, X, Sparkles, MessageCircle } from "lucide-react";

interface NavbarProps {
  vipGroupUrl?: string;
  masterWhatsApp?: string;
}

export function Navbar({
  vipGroupUrl = "https://chat.whatsapp.com/",
  masterWhatsApp = "5564993049090",
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const cleanPhone = masterWhatsApp.replace(/\D/g, "");
  const advertiseWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Olá! Tenho interesse em anunciar minha empresa no portal Caldas Novas Online."
  )}`;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A4D9C] text-white shadow-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-[72px] sm:h-[86px] flex items-center justify-between gap-2">
        {/* LOGO OFICIAL PNG (ÍCONE COMPACTO E PROPORÇÃO HORIZONTAL VALORIZADA) */}
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center shrink-0"
        >
          <img
            src="https://ldsite.com.br/wp-content/uploads/2026/11/logo-oficial-site.fw_.png"
            alt="Caldas Novas Online • Guia Comercial de Caldas Novas"
            className="h-12 sm:h-16 w-auto max-w-[195px] sm:max-w-none object-contain shrink-0 select-none"
          />
        </Link>

        {/* BOTÃO GRUPO VIP + ÁREA DA EMPRESA + MENU HAMBÚRGUER */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <a
            href={vipGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FF7A00] hover:bg-orange-500 text-slate-950 font-extrabold text-[11px] sm:text-xs px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full inline-flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
          >
            <Flame className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
            <span>Grupo VIP</span>
            <span className="hidden sm:inline">Ofertas</span>
          </a>

          {/* Atalho direto no Desktop para Planos */}
          <Link
            href="/planos"
            className="hidden lg:inline-flex bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-full items-center gap-1.5 transition whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFB800] shrink-0" />
            <span>Planos</span>
          </Link>

          {/* Atalho direto no Desktop para Área da Empresa */}
          <Link
            href="/painel-empresa"
            className="hidden md:inline-flex bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-4 py-2.5 rounded-full items-center gap-1.5 transition whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Área da Empresa</span>
          </Link>

          {/* Botão Hambúrguer */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MENU DROPDOWN ABERTO PELO HAMBÚRGUER */}
      {menuOpen && (
        <div className="bg-[#062F63] border-t border-white/10 px-4 py-4 shadow-xl">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2.5">
            <a
              href={vipGroupUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#FF7A00] text-slate-950 font-extrabold text-xs"
            >
              <Flame className="w-4 h-4 fill-slate-950" />
              Grupo VIP de Ofertas
            </a>

            <Link
              href="/painel-empresa"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              <User className="w-4 h-4 text-[#FFB800]" />
              Área da Empresa (Entrar / Cadastrar)
            </Link>

            <Link
              href="/planos"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              <Sparkles className="w-4 h-4 text-[#FFB800]" />
              Planos e Visibilidade
            </Link>

            <a
              href={advertiseWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-xs"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              Falar no WhatsApp Comercial
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
