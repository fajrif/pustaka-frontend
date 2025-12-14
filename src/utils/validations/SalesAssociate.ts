import { z } from "zod";
import { toISOString, optionalEmailSchema, preprocessOptionalNumber } from "./validation_helper";

export const salesAssociateSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode Publisher harus diisi"),
  name: z.string().min(3, "Nama Publisher harus diisi"),
  description: z.string().nullable().optional(),
  email: optionalEmailSchema(),
  address: z.string().nullable().optional(),
  city_id: z.string().uuid("Invalid city ID format").min(1, "Kota harus diisi"),
  area: z.string().nullable().optional(),
  phone1: z.string().nullable().optional(),
  phone2: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  jenis_pembayaran: z.string().nullable().optional(),
  join_date: z.preprocess((val) => toISOString(val as string), z.string().nullable().optional()),
  end_join_date: z.preprocess((val) => toISOString(val as string), z.string().nullable().optional()),
  discount: z.preprocess(preprocessOptionalNumber, z.number().optional()),
})
