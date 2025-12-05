import { z } from "zod";

export const kelasSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode kelas harus diisi"),
  name: z.string().min(1, "Nama kelas harus diisi"),
  description: z.string().nullable().optional(),
});
