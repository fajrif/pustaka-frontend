import { z } from "zod";
import { toISOString } from "./validation_helper";

export const salesTransactionSchema = z.object({
  id: z.string().optional(),
  sales_associate_id: z.string().uuid("Sales Associate ID format").min(1, "Sales Associate ID harus diisi"),
  expedition_id: z.string().optional(),
  payment_type: z.string().nullable().optional(),
  transaction_date: z.preprocess((val) => toISOString(val as string), z.string()),
  due_date: z.preprocess((val) => toISOString(val as string), z.string().nullable().optional()),
  expedition_price: z.string().optional(),
})

export const salesTransactionItemSchema = z.object({
  id: z.string().optional(),
  transaction_id: z.string().uuid("Invalid Transaction ID format").min(1, "Transaction ID harus diisi"),
  book_id: z.string().uuid("Invalid Book ID format").min(1, "Book ID harus diisi"),
  quantity: z.number().min(1, "Quantity harus diisi"),
})

export const salesTransactionInstallmentSchema = z.object({
  id: z.string().optional(),
  transaction_id: z.string().uuid("Invalid Transaction ID format").min(1, "Transaction ID harus diisi"),
  installment_date: z.preprocess((val) => toISOString(val as string), z.string()),
  amount: z.number().min(1, "Amount harus diisi"),
  note: z.string().nullable().optional(),
})
