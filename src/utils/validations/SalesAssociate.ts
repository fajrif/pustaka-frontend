import { z } from "zod";
import { toISOString, preprocessOptionalEmail, preprocessOptionalNumber } from "./validation_helper";

export const salesAssociateSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode Publisher harus diisi"),
  name: z.string().min(3, "Nama Publisher harus diisi"),
  description: z.string().optional(),
  email: z.preprocess(preprocessOptionalEmail, z.string().email("Format email tidak valid").optional()),
  address: z.string().optional(),
  city_id: z.string().uuid("Invalid city ID format").min(1, "Kota harus diisi"),
  area: z.string().optional(),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  website: z.string().optional(),
  jenis_pembayaran: z.string().optional(),
  join_date: z.preprocess((val) => toISOString(val as string), z.string().optional()),
  end_join_date: z.preprocess((val) => toISOString(val as string), z.string().optional()),
  discount: z.preprocess(preprocessOptionalNumber, z.number().optional()),
})
