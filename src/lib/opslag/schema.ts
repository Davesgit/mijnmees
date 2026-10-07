import { z } from "zod";

// Runtime-validatie van wat een apparaat naar de server stuurt. Alles wat niet past, wordt geweigerd.

const uuid = z.uuid();
const iso = z.iso.datetime({ offset: true });

export const slotSchema = z.object({
  id: uuid,
  vraagId: z.string().max(80),
  vraagVersie: z.number().int().min(1),
  herhalingVan: uuid.optional(),
  vervolgGepland: z.boolean().optional(),
  hulp: z.object({ hints: z.union([z.literal(0), z.literal(1), z.literal(2)]), uitleg: z.boolean(), fouten: z.number().int().min(0).max(50) }),
  uitkomst: z.enum(["zelfstandig", "met-hulp", "met-uitleg"]).optional(),
  antwoord: z.string().max(200).optional(),
});

export const sessieSchema = z.object({
  id: uuid,
  leerdoelId: z.string().max(80),
  onderdeelId: z.string().max(80),
  onderwerpId: z.string().max(80),
  niveau: z.enum(["makkelijk", "past-bij-mij", "uitdagend"]),
  aantal: z.number().int().min(1).max(40),
  bron: z.enum(["voorstel", "zelf"]),
  slots: z.array(slotSchema).min(1).max(40),
  index: z.number().int().min(0).max(40),
  versie: z.number().int().min(1),
  status: z.enum(["bezig", "afgerond"]),
  gestartOp: iso,
  afgerondOp: iso.optional(),
});

export const pogingSchema = z.object({
  eventId: uuid,
  sessieId: uuid,
  slotId: uuid,
  vraagId: z.string().max(80),
  vraagVersie: z.number().int().min(1),
  leerdoelId: z.string().max(80),
  antwoord: z.string().max(200),
  resultaat: z.enum(["goed", "fout"]),
  eerstePoging: z.boolean(),
  hulpVooraf: z.object({ hints: z.number().int().min(0).max(2), uitleg: z.boolean() }),
  op: iso,
});

export const weetjeSchema = z.object({
  weetjeId: z.string().max(40),
  sessieId: uuid,
  dag: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  op: iso,
});

export const reviewSchema = z.object({ leerdoelId: z.string().max(80), vanSessieId: uuid, op: iso });

export const syncVerzoekSchema = z.object({
  sessies: z.array(sessieSchema).max(50),
  pogingen: z.array(pogingSchema).max(500),
  weetjes: z.array(weetjeSchema).max(50),
  reviews: z.array(reviewSchema).max(50),
});

export type SyncVerzoek = z.infer<typeof syncVerzoekSchema>;

export type SyncAntwoord = {
  status: "accepted" | "invalid" | "unauthorized" | "retryable";
  sessies?: Record<string, number>;
  pogingen?: string[];
  weetjes?: string[];
};
