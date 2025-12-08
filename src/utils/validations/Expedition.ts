import { z } from "zod";
import { preprocessOptionalEmail } from "./validation_helper";

export const expeditionSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode Ekspedisi harus diisi"),
  name: z.string().min(3, "Nama Ekspedisi harus diisi"),
  description: z.string().nullable().optional(),
  email: z.preprocess(preprocessOptionalEmail, z.string().email("Format email tidak valid").nullable().optional()),
  address: z.string().nullable().optional(),
  city_id: z.string().uuid("Invalid city ID format").min(1, "Kota harus diisi"),
  area: z.string().nullable().optional(),
  phone1: z.string().nullable().optional(),
  phone2: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
})
