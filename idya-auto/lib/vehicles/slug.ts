/** `{year}-{make}-{model}-{trim}-{stock}` lowercased, accents and symbols stripped (brief §4). */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildVehicleSlug(v: {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  stockNumber: string;
}): string {
  return [v.year, v.make, v.model, v.trim ?? "", v.stockNumber]
    .map((p) => slugify(String(p)))
    .filter(Boolean)
    .join("-");
}
