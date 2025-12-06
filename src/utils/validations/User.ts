import { z } from "zod";

// TODO:
// Password must be at least 8 characters long, must contain at least one number, one uppercase letter, one lowercase letter, and one special character
// check password confirmation matches password

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordErrorMessage = "Password harus terdiri dari minimal 8 karakter, mengandung setidaknya satu angka, satu huruf besar, satu huruf kecil, dan satu karakter khusus.";
const passwordConfirmationErrorMessage = "Konfirmasi password tidak sesuai dengan password.";

export const userSchemaWithPasswordConfirmation = z.object({
  id: z.string().optional(),
  email: z.string().min(1, "Email harus diisi").email("Format email tidak valid"),
  password: z.string().min(8, passwordErrorMessage).regex(passwordRegex, passwordErrorMessage),
  password_confirmation: z.string().min(8, passwordErrorMessage).regex(passwordRegex, passwordErrorMessage),
  full_name: z.string().min(3, "Nama lengkap harus diisi"),
  role: z.enum(['admin', 'user', 'operator']).nullable().optional(),
}).refine((data) => data.password === data.password_confirmation, {
  message: passwordConfirmationErrorMessage,
})

export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().min(1, "Email harus diisi").email("Format email tidak valid"),
  full_name: z.string().min(3, "Nama lengkap harus diisi"),
  role: z.enum(['admin', 'user', 'operator']).nullable().optional(),
})
