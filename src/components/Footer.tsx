import Link from "next/link";
import { Megaphone, MessageCircle, Flame } from "lucide-react";

interface Props {
  vipGroupUrl?: string;
  masterWhatsApp?: string;
}

export function Footer({
  vipGroupUrl = "https://chat.whatsapp.com/",
  masterWhatsApp = "5564981005505",
}: Props) {
  return (
    <footer className="mt-12">
      {/* Seção Grupo VIP para Usuários Finais */}
      <section id="grupo-vip" className="max-w-6xl mx-auto px-4 mb-6">
        <div className="rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 p-6 md:p-8 text-slate-950 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 bg-slate-950 text-amber-400 text-xs font-extrabold uppercase px-3 py-1 rounded-full">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> Clube Exclusivo
            </span>
            <h3 className="text-2xl font-black tracking-tight">
              Receba Cupons Secretos em Primeira Mão!
            </h3>
            <p className="text-sm font-medium text-slate-900 max-w-xl">
              Entre no Grupo VIP do Caldas Online no WhatsApp e receba ofertas relâmpago de pizzarias, hotéis, parques e lojas da cidade antes de todo mundo.
            </p>
          </div>
          <a
            href={vipGroupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-sm px-6 py-4 rounded-xl shadow-lg flex items-center gap-2 transition whitespace-nowrap"
          >
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            ENTRAR NO GRUPO VIP GRÁTIS
          </a>
        </div>
      </section>

      {/* Banner Azul Anuncie no Caldas Online */}
      <section className="max-w-6xl mx-auto px-4 mb-8">
        <div className="rounded-2xl bg-[#0A4D9C] text-white p-6 md:p-8 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Megaphone className="w-7 h-7 text-[#FFB800]" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-extrabold">
                ANUNCIE NO CALDAS ONLINE
              </h3>
              <p className="text-sm text-blue-100 mt-0.5">
                Cadastre sua empresa grátis ou destaque sua marca nos banners principais para milhares de clientes!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/painel-empresa"
              className="bg-white text-[#0A4D9C] hover:bg-blue-50 font-extrabold text-sm px-5 py-3 rounded-xl transition"
            >
              Cadastrar Grátis
            </Link>
            <a
              href={`https://wa.me/${masterWhatsApp}?text=${encodeURIComponent(
                "Olá! Quero saber como destacar minha empresa nos banners do Caldas Online."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1DB954] hover:bg-[#18a349] text-white font-extrabold text-sm px-5 py-3 rounded-xl flex items-center gap-2 transition"
            >
              <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Rodapé Institucional */}
      <div className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="font-bold text-slate-800 text-sm">
            CALDAS <span className="text-[#0A4D9C]">ONLINE</span> — O Guia Comercial de Caldas Novas
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#0A4D9C]">Início</Link>
            <Link href="/painel-empresa" className="hover:text-[#0A4D9C]">Anunciar Grátis</Link>
            <Link href="/master" className="hover:text-[#0A4D9C]">Admin</Link>
          </div>
          <div>© {new Date().getFullYear()} Caldas Online • Caldas Novas - GO</div>
        </div>
      </div>
    </footer>
  );
}
