import { z } from "zod";

export const bookSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nama Buku harus diisi"),
  description: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  isbn: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  stock: z.number().min(0, "Stok tidak boleh negatif").optional(),
  jenis_buku_id: z.string().uuid("Invalid Jenis Buku ID format").min(1, "Jenis Buku harus diisi"),
  jenjang_studi_id: z.string().uuid("Invalid Jenjang Studi ID format").min(1, "Jenjang Studi harus diisi"),
  bidang_studi_id: z.string().uuid("Invalid Bidang Studi ID format").min(1, "Bidang Studi harus diisi"),
  kelas_id: z.string().uuid("Invalid Kelas ID format").min(1, "Kelas harus diisi"),
  publisher_id: z.string().uuid("Invalid Publisher ID format").min(1, "Publisher harus diisi"),
  price: z.number().min(0, "Harga tidak boleh negatif").optional(),
});
