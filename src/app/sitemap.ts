import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cursor-cameroun-nine.vercel.app";

  const paths = [
    "/",
    "/learn",
    "/events",
    "/gallery",
    "/roadmap",
    "/community",
    "/contact",
    "/partners",
    "/privacy",
  ];
  const lastModified = new Date();

  return paths.flatMap((path) => {
    const french = path === "/" ? `${baseUrl}/` : `${baseUrl}${path}`;
    const english = path === "/" ? `${baseUrl}/en` : `${baseUrl}/en${path}`;
    return [
      { url: french, lastModified },
      { url: english, lastModified },
    ];
  });
}
