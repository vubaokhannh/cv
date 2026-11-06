/**
 * Generates URL-friendly anchor slugs from Vietnamese and English text.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip diacritics
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-") // Non-alphanumeric to hyphens
    .replace(/(^-|-$)/g, ""); // Trim hyphens
}
