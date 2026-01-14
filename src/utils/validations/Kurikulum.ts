import { z } from "zod";

export const kurikulumSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "Kode kurikulum harus diisi"),
  name: z.string().min(1, "Nama kurikulum harus diisi"),
  description: z.string().nullable().optional(),
});
