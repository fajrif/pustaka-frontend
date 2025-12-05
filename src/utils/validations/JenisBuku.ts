import { z } from "zod";

export const jenisBukuSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode buku harus diisi"),
  name: z.string().min(1, "Nama buku harus diisi"),
  description: z.string().nullable().optional(),
});
