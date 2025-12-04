// src/utils/validation.ts
import { z } from "zod";

// Fungsi helper untuk mengubah string tanggal sederhana (YYYY-MM-DD) menjadi timestamp lengkap (ISO 8601)
const toISOString = (dateString: string) => {
  if (!dateString) return null;
  // Ini mengasumsikan waktu lokal tengah malam di lokasi browser,
  // lalu mengonversinya menjadi UTC (format Z di akhir)
  try {
    const date = new Date(dateString);
    // Jika format input YYYY-MM-DD, Date() akan menganggapnya UTC 00:00.
    // Kita ingin memastikan outputnya memiliki format ISO yang lengkap.
    return date.toISOString();
  } catch {
    return null; // Handle invalid date strings gracefully
  }
};

// Helper function untuk Preprocessing Angka Opsional
const preprocessOptionalNumber = (val: any) => {
  // Jika nilai null, undefined, atau string kosong (""), kembalikan undefined
  if (val === null || val === undefined || val === "") {
    return undefined;
  }
  const num = Number(val);
  // Jika konversi menghasilkan NaN (misalnya input "abc"),
  // kembalikan NaN, dan Zod akan menangani error tipe.
  return num;
};

export const projectSchema = z.object({
  id: z.string().optional(),
  no_sp2k: z.string().min(1, "No SP2K required"),
  no_perjanjian: z.string().nullable().optional(),
  no_amandemen: z.string().nullable().optional(),
  tanggal_perjanjian: z.preprocess((val) => toISOString(val as string), z.string().nullable().optional()),
  judul_pekerjaan: z.string().min(1, "Judul required"),
  tanggal_mulai: z.preprocess((val) => toISOString(val as string), z.string().min(1, "Tanggal mulai required")),
  tanggal_selesai: z.preprocess((val) => toISOString(val as string), z.string().min(1, "Tanggal selesai required")),
  nilai_pekerjaan: z.preprocess((v) => Number(v), z.number().positive()),
  management_fee: z.preprocess(preprocessOptionalNumber, z.number().optional()),
  tarif_management_fee_persen: z.preprocess(preprocessOptionalNumber, z.number().optional()),
  client_id: z.string().uuid("Invalid client ID format").min(1, "Client is required"),
  contract_type_id: z.string().uuid("Invalid contract type ID format").min(1, "Jenis Kontrak is required"),
  status_kontrak: z.string().optional().default("Active"),
})
.refine((data) => new Date(data.tanggal_selesai) > new Date(data.tanggal_mulai), {
  // Validasi: tanggal_selesai > tanggal_mulai
  message: "Tanggal selesai harus setelah tanggal mulai",
  path: ["tanggal_selesai"],
})
.refine((data) => {
    // Validasi: tanggal_perjanjian <= tanggal_mulai
    // Opsional, jadi OK jika kosong
    if (!data.tanggal_perjanjian) return true;
    return new Date(data.tanggal_perjanjian) <= new Date(data.tanggal_mulai);
  }, {
    message: "Tanggal perjanjian tidak boleh setelah tanggal mulai",
    path: ["tanggal_perjanjian"],
  })
.refine((data) => {
  // Validasi: management_fee < nilai_pekerjaan
  // Opsional, jadi OK jika kosong
  if (data.management_fee === undefined || data.management_fee === null) return true;
  return data.management_fee < data.nilai_pekerjaan;
}, {
  message: "Management fee tidak boleh melebihi nilai pekerjaan",
  path: ["management_fee"],
});

export const transactionSchema = z.object({
  id: z.string().optional(),
  project_id: z.string().uuid("Invalid project ID format").min(1, "Project is required"),
  tanggal_transaksi: z.preprocess((val) => toISOString(val as string), z.string().min(1, "Tanggal transaksi required")),
  tanggal_po_tagihan: z.preprocess((val) => toISOString(val as string), z.string().nullable().optional()),
  cost_type_id: z.string().uuid("Invalid cost type ID format").min(1, "Jenis Biaya is required"),
  jumlah_realisasi: z.preprocess((v) => Number(v), z.number().min(100000, "Jumlah realisasi harus minimal 100.000").positive("Jumlah realisasi harus positif")),
  deskripsi_realisasi: z.string().min(1, "Deskripsi required"),
  jumlah_tenaga_kerja: z.preprocess((v) => Number(v), z.number().optional()),
  bukti_transaksi_url: z.string().nullable().optional(),
});
