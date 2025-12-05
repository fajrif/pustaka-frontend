// Fungsi helper untuk mengubah string tanggal sederhana (YYYY-MM-DD) menjadi timestamp lengkap (ISO 8601)
export const toISOString = (dateString: string) => {
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

