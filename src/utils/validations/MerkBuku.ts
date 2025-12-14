import { z } from "zod";

export const merkBukuSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode merk buku harus diisi"),
  name: z.string().min(1, "Nama merk buku harus diisi"),
  description: z.string().nullable().optional(),
});
