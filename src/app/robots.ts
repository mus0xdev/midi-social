import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/auth",
          "/upload",
          "/settings",
          "/favorites",
          "/admin",
          "/api/",
        ],
      },
    ],
    sitemap: "https://midylo.vercel.app/sitemap.xml",
  };
}