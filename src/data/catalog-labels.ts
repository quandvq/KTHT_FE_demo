import { catalog } from "./catalog";

const clean = (value: string) =>
  value.replace(/\bpharmacity\b/giu, " ").replace(/\s{2,}/g, " ").trim();

// Names are presentation labels only; SKU, source data and images remain unchanged.
catalog.forEach((product) => {
  product.name = clean(product.name);
});

export const cleanProductLabel = clean;
