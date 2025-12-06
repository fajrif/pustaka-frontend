import { z } from "zod";
import { preprocessOptionalEmail } from "./validation_helper";

export const expeditionSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode Ekspedisi harus diisi"),
  name: z.string().min(3, "Nama Ekspedisi harus diisi"),
  description: z.string().optional(),
  email: z.preprocess(preprocessOptionalEmail, z.string().email("Format email tidak valid").optional()),
  address: z.string().optional(),
  city_id: z.string().uuid("Invalid city ID format").min(1, "Kota harus diisi"),
  area: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  website: z.string().optional(),
})
