import { z } from "zod";
import { toISOString } from "./validation_helper";

export const salesTransactionSchema = z.object({
  id: z.string().optional(),
  sales_associate_id: z.string().uuid("Sales Associate ID format").min(1, "Sales Associate ID harus diisi"),
  payment_type: z.string().nullable().optional(),
  transaction_date: z.preprocess((val) => toISOString(val as string), z.string()),
  due_date: z.preprocess((val) => toISOString(val as string), z.string().nullable().optional()),
  status: z.number().optional(), // Added status for updates
})

export const salesTransactionItemSchema = z.object({
  id: z.string().optional(),
  transaction_id: z.string().uuid("Invalid Transaction ID format").min(1, "Transaction ID harus diisi"),
  book_id: z.string().uuid("Invalid Book ID format").min(1, "Book ID harus diisi"),
  quantity: z.number().min(1, "Quantity harus diisi"),
})

export const paymentSchema = z.object({
  id: z.string().optional(),
  transaction_id: z.string().uuid("Invalid Transaction ID format").min(1, "Transaction ID harus diisi"),
  payment_date: z.preprocess((val) => toISOString(val as string), z.string()),
  amount: z.number().min(1, "Amount harus diisi").nonnegative("Amount tidak boleh negatif"),
  note: z.string().nullable().optional(),
})

export const shippingSchema = z.object({
  id: z.string().optional(),
  transaction_id: z.string().uuid("Invalid Transaction ID format").min(1, "Transaction ID harus diisi"),
  expedition_id: z.string().uuid("Invalid Expedition ID format").min(1, "Expedition ID harus diisi"),
  no_resi: z.string().min(1, "No Resi harus diisi"),
  total_amount: z.number().min(0, "Total Amount tidak boleh negatif"),
})
