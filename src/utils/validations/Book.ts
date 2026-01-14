import { z } from "zod";
import { preProcessOptionalString } from "./validation_helper";

const currentYear = new Date().getFullYear();
const yearRegex = /^\d{4}$/;
const yearErrorMessage = "Tahun harus berupa angka 4 digit.";
const yearRangeErrorMessage = "Tahun harus antara 1900 sampai tahun sekarang.";

const yearSchema = z
  .preprocess(preProcessOptionalString, z
  .string()
  .regex(yearRegex, yearErrorMessage)
  .transform((val) => Number(val))
  .refine((val) => val >= 1900, {
    message: yearRangeErrorMessage,
  })
  .refine((val) => val <= currentYear, {
    message: `Tahun maksimal ${currentYear}`,
  })
  .optional()
  .nullable());

export const bookSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nama Buku harus diisi"),
  description: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  isbn: z.string().nullable().optional(),
  year: yearSchema,
  stock: z.number().min(0, "Stok tidak boleh negatif").optional(),
  merk_buku_id: z.string().uuid("Invalid Merk Buku ID format").min(1, "Merk Buku harus diisi"),
  jenis_buku_id: z.string().uuid("Invalid Jenis Buku ID format").min(1, "Jenis Buku harus diisi"),
  jenjang_studi_id: z.string().uuid("Invalid Jenjang Studi ID format").min(1, "Jenjang Studi harus diisi"),
  bidang_studi_id: z.string().uuid("Invalid Bidang Studi ID format").min(1, "Bidang Studi harus diisi"),
  kelas: z.string().nullable().optional(),
  curriculum_id: z.string().uuid("Invalid Kurikulum ID format").min(1, "Kurikulum harus diisi"),
  publisher_id: z.string().uuid("Invalid Publisher ID format").min(1, "Penerbit harus diisi"),
  periode: z.number().min(1, "Periode semester harus diisi").optional(),
  price: z.number().min(0, "Harga tidak boleh negatif").optional(),
  no_pages: z.number().min(0, "Jumlah halaman tidak boleh negatif").nullable().optional(),
});
