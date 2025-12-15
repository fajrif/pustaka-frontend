import { z } from "zod";

// Fungsi helper untuk mengubah string tanggal sederhana (YYYY-MM-DD) menjadi timestamp lengkap (ISO 8601)
export const toISOString = (dateString: string) => {
  if (dateString === null || dateString === undefined || dateString === "") {
    return undefined;
  }
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
export const preprocessOptionalNumber = (val: any) => {
  // Jika nilai null, undefined, atau string kosong (""), kembalikan undefined
  if (val === null || val === undefined || val === "") {
    return undefined;
  }
  const num = Number(val);
  // Jika konversi menghasilkan NaN (misalnya input "abc"),
  // kembalikan NaN, dan Zod akan menangani error tipe.
  return num;
};

// Helper function untuk Preprocessing String Opsional
// Returns empty string instead of undefined to ensure field is always sent in JSON payload
export const preProcessOptionalString = (val: any) => {
  if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
    return "";
  }
  return val;
};

// Zod schema untuk email opsional yang selalu mengirim field (empty string jika kosong)
export const optionalEmailSchema = () =>
  z.preprocess(
    preProcessOptionalString,
    z.string().refine(
      (val) => val === "" || z.string().email().safeParse(val).success,
      { message: "Format email tidak valid" }
    )
  );

// const currentYear = new Date().getFullYear();
// const yearRegex = /^\d{4}$/;
// const yearErrorMessage = "Tahun harus berupa angka 4 digit.";
// const yearRangeErrorMessage = "Tahun harus antara 1900 sampai tahun sekarang.";
// 
// export const optionalYearSchema = () =>
//   z.preprocess(
//     preProcessOptionalString,
//     z.string().refine(
//       (val) => yearRegex.test(val),
//       { message: yearErrorMessage }
//     )
//     .transform((val) => Number(val))
//     .pipe(
//         z.number()
//           .min(1900, yearRangeErrorMessage)
//           .max(currentYear, `Tahun maksimal ${currentYear}`)
//       )
//   );
