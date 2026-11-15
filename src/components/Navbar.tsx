"use client";

import Link from "next/link";
import { MapPin, UserCheck, Flame, ShieldCheck } from "lucide-react";

interface Props {
  vipGroupUrl?: string;
}

export function Navbar({ vipGroupUrl = "#grupo-vip" }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-[#0A4D9C] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
        {/* Logo Caldas Online */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF7A00] to-[#FFB800] flex items-center justify-center font-black text-slate-950 text-lg shadow">
            CO
          </div>
          <div className="leading-none">
            <span className="font-extrabold text-lg tracking-tight block">
              CALDAS <span className="text-[#FFB800]">ONLINE</span>
            </span>
            <span className="text-[10px] text-blue-200 font-medium flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-orange-400" /> Caldas Novas - GO
            </span>
          </div>
        </Link>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          <a
            href={vipGroupUrl}
            target={vipGroupUrl.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FF7A00] to-[#FFB800] text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-full shadow hover:brightness-105 transition"
          >
            <Flame className="w-3.5 h-3.5 fill-slate-950" />
            Grupo VIP Ofertas
          </a>

          <Link
            href="/painel-empresa"
            className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold text-xs px-3.5 py-2 rounded-full transition"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Área da Empresa</span>
          </Link>

          <Link
            href="/master"
            title="Acesso Master"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-blue-200 hover:text-white transition"
          >
            <ShieldCheck className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
