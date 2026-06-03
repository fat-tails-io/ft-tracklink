/** Slug for custom circuit uploads (lowercase, hyphens). */
export const slugifyCircuitId = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `circuit-${Date.now()}`;
};
