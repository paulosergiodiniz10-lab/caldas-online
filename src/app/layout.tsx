import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Caldas Online | O Guia Comercial de Caldas Novas - GO",
  description:
    "Tudo o que você precisa em um só lugar! Encontre empresas, hotéis, restaurantes, cupons de desconto exclusivos e utilidades em Caldas Novas.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0A4D9C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${jakarta.className} antialiased min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
