import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "http://localhost:3000";
  const staticRoutes = ["", "/journeys", "/destinations", "/collections", "/journal", "/bespoke", "/about", "/contact", "/faq"].map((path) => ({
    url: `${base}${path}`,
  }));
  const journeys = catalog.journeys.map((item) => ({ url: `${base}/journeys/${item.slug}` }));
  const places = catalog.destinations.map((item) => ({ url: `${base}/destinations/${item.slug}` }));
  return [...staticRoutes, ...journeys, ...places];
}
