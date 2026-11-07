import data from "@/content/catalog.json";

export type Photo = {
  src: string;
  alt: string;
  width: number;
  height: number;
  credit: string;
  license: string;
  source: string;
  role?: string;
  id?: string;
};

export type Destination = (typeof data.destinations)[number];
export type Journey = (typeof data.journeys)[number];
export type Collection = (typeof data.collections)[number];
export type Article = (typeof data.journal)[number];

export const catalog = data;

export function destination(slug: string) {
  return data.destinations.find((item) => item.slug === slug);
}

export function journey(slug: string) {
  return data.journeys.find((item) => item.slug === slug);
}

export function journeysFor(destinationSlug: string) {
  return data.journeys.filter((item) => item.destination === destinationSlug);
}

export function collection(slug: string) {
  return data.collections.find((item) => item.slug === slug);
}

export function article(slug: string) {
  return data.journal.find((item) => item.slug === slug);
}

export function hero(id: string) {
  return data.heroes.find((item) => item.id === id) ?? data.heroes[0];
}

export const styles = [...new Set(data.journeys.map((item) => item.style))];
