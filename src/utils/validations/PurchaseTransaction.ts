import { z } from 'zod';

export const purchaseTransactionItemSchema = z.object({
  book_id: z.string().uuid("Invalid Book ID"),
  quantity: z.number().min(1, "Quantity minimal 1"),
  price: z.number().min(0, "Harga tidak boleh negatif"),
});

export const purchaseTransactionSchema = z.object({
  supplier_id: z.string().uuid("Invalid Penerbit ID").min(1, "Penerbit harus dipilih"),
  purchase_date: z.string().min(1, "Tanggal pembelian harus diisi"),
  note: z.string().optional(),
  items: z.array(purchaseTransactionItemSchema).min(1, "Minimal 1 item buku").optional(),
});

export type PurchaseTransactionFormData = z.infer<typeof purchaseTransactionSchema>;
export type PurchaseTransactionItem = z.infer<typeof purchaseTransactionItemSchema>;
