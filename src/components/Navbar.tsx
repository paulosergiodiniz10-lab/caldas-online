"use client";

import Link from "next/link";
import { Flame, User, ShieldCheck } from "lucide-react";

interface NavbarProps {
  vipGroupUrl?: string;
}

export function Navbar({ vipGroupUrl = "https://chat.whatsapp.com/" }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#0A4D9C] text-white shadow-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 sm:h-[72px] flex items-center justify-between gap-3">
        {/* LOGO OFICIAL */}
        <Link href="/" className="flex items-center shrink-0">
          <img
            src="https://ldsite.com.br/wp-content/uploads/2026/11/Logo-3D-Caldas-Online_azul-scaled.jpg"
            alt="Caldas Online • Guia Comercial de Caldas Novas"
            className="h-10 sm:h-12 w-auto object-contain rounded-xl"
          />
        </Link>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <a
            href={vipGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FF7A00] hover:bg-orange-500 text-slate-950 font-extrabold text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-full inline-flex items-center gap-1.5 shadow-sm transition whitespace-nowrap"
          >
            <Flame className="w-3.5 h-3.5 fill-slate-950 shrink-0" />
            <span>Grupo VIP</span>
            <span className="hidden md:inline">Ofertas</span>
          </a>

          <Link
            href="/painel-empresa"
            className="bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 rounded-full inline-flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Área da Empresa</span>
          </Link>

          <Link
            href="/master"
            title="Painel Master"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
