import { z } from "zod";

export const citySchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode kota harus diisi"),
  name: z.string().min(1, "Nama kota harus diisi"),
});
