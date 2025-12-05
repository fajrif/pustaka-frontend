import { z } from "zod";

export const bidangStudiSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode bidang studi harus diisi"),
  name: z.string().min(1, "Nama bidang studi harus diisi"),
  description: z.string().nullable().optional(),
});
