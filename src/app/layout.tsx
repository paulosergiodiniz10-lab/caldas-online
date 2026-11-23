import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://caldasnovasonline.com.br"),
  title: {
    default: "Caldas Novas Online | O Guia Comercial de Caldas Novas - GO",
    template: "%s | Caldas Novas Online",
  },
  description:
    "Tudo o que você precisa em um só lugar! Encontre empresas, hotéis, restaurantes, cupons de desconto exclusivos e utilidades em Caldas Novas - GO.",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "a_09nMcOYQpCaIH2qsYlog0nkyWED0D4qE_pOLz1JOY",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "https://ldsite.com.br/wp-content/uploads/2026/11/icone_insta.fw_.png",
    shortcut:
      "https://ldsite.com.br/wp-content/uploads/2026/11/icone_insta.fw_.png",
    apple:
      "https://ldsite.com.br/wp-content/uploads/2026/11/icone_insta.fw_.png",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://caldasnovasonline.com.br",
    siteName: "Caldas Novas Online",
    title: "Caldas Novas Online | O Guia Comercial de Caldas Novas - GO",
    description:
      "Encontre empresas, hotéis, restaurantes, cupons de desconto exclusivos e utilidades rápidas em Caldas Novas - GO.",
    images: [
      {
        url: "https://ldsite.com.br/wp-content/uploads/2026/11/logo-site.jpg",
        width: 1200,
        height: 400,
        alt: "Caldas Novas Online • Guia Comercial de Caldas Novas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caldas Novas Online | O Guia Comercial de Caldas Novas - GO",
    description:
      "Encontre empresas, hotéis, restaurantes, cupons de desconto exclusivos e utilidades em Caldas Novas - GO.",
    images: ["https://ldsite.com.br/wp-content/uploads/2026/11/logo-site.jpg"],
  },
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
      <body
        className={`${jakarta.className} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
