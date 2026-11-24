import { z } from 'astro/zod';

/** Fotoalben: tolerant gegenüber leeren Feldern aus der Eingabemaske. */
export const gallerySchema = z.object({
  title: z.string(),
  year: z.coerce.number().int(),
  images: z.array(z.string()).nullish().transform((v) => v ?? []),
});
