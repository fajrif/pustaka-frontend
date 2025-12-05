import { z } from "zod";

export const jenjangStudiSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode jenjang studi harus diisi"),
  name: z.string().min(1, "Nama jenjang studi harus diisi"),
  description: z.string().nullable().optional(),
  period: z.string().nullable().optional(),
});
