import { z } from "zod";
import { preprocessOptionalEmail } from "./validation_helper";

export const billerSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode Biller harus diisi"),
  name: z.string().min(3, "Nama Biller harus diisi"),
  description: z.string().nullable().optional(),
  npwp: z.string().min(1, "NPWP harus diisi"),
  address: z.string().min(1, "Alamat harus diisi"),
  city_id: z.string().uuid("Invalid city ID format").min(1, "Kota harus diisi"),
  phone1: z.string().min(1, "Phone 1 harus diisi"),
  phone2: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  email: z.preprocess(preprocessOptionalEmail, z.string().email("Format email tidak valid").nullable().optional()),
  website: z.string().nullable().optional(),
})
