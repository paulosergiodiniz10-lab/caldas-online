import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/empresa/", "/categoria/", "/planos"],
        disallow: ["/master", "/painel", "/login", "/cadastro", "/api/"],
      },
    ],
    sitemap: "https://caldasnovasonline.com.br/sitemap.xml",
    host: "https://caldasnovasonline.com.br",
  };
}
