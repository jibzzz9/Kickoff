import { z } from "zod";
import { COMPANY_ROLES, LOCALES } from "./constants";

export const localeSchema = z.enum(LOCALES);
export const companyRoleSchema = z.enum(COMPANY_ROLES);

const password = z.string().min(8).max(72);

/** Âge en années pleines à une date donnée. */
export function ageOn(birthDate: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

export const signupStudentSchema = z
  .object({
    email: z.string().email(),
    password,
    firstName: z.string().trim().min(1).max(60),
    birthDate: z.coerce.date(),
    commune: z.string().trim().min(1).max(100),
    locale: localeSchema.default("fr"),
    acceptTerms: z.literal(true),
    acceptAiNotice: z.literal(true),
  })
  .superRefine((v, ctx) => {
    const age = ageOn(v.birthDate);
    if (age < 12 || age > 25) {
      ctx.addIssue({ code: "custom", path: ["birthDate"], message: "invalid_birth_date" });
    }
  });
export type SignupStudent = z.infer<typeof signupStudentSchema>;

export const signupCompanySchema = z.object({
  email: z.string().email(),
  password,
  contactName: z.string().trim().min(1).max(100),
  companyName: z.string().trim().min(1).max(150),
  ideNumber: z
    .string()
    .trim()
    .regex(/^CHE-?\d{3}\.?\d{3}\.?\d{3}$/i, "invalid_ide")
    .optional(),
  commune: z.string().trim().min(1).max(100),
  locale: localeSchema.default("fr"),
  acceptTerms: z.literal(true),
});
export type SignupCompany = z.infer<typeof signupCompanySchema>;

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export type Login = z.infer<typeof loginSchema>;
