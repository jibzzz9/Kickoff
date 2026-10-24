import { z } from "zod";
import { LANGUAGE_CODES, SOFT_SKILLS } from "./listings";
import { SCHOOL_YEARS } from "./constants";

export const aptitudeTestSchema = z.object({
  name: z.string().trim().min(1).max(60),
  score: z.number().min(0).max(100).optional(),
});

export const trialInternshipSchema = z.object({
  professionCode: z.string().min(1),
  company: z.string().trim().min(1).max(100),
  year: z.number().int().min(2015).max(2100),
});

export const studentProfileSchema = z.object({
  communeId: z.string().uuid().optional(),
  schoolYear: z.enum(SCHOOL_YEARS).optional(),
  /** Moyenne générale sur l'échelle suisse 1-6. */
  average: z.number().min(1).max(6).optional(),
  aptitudeTests: z.array(aptitudeTestSchema).max(10).default([]),
  trialInternships: z.array(trialInternshipSchema).max(20).default([]),
  languages: z.array(z.enum(LANGUAGE_CODES)).max(6).default([]),
  interests: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  softSkills: z.array(z.enum(SOFT_SKILLS)).max(8).default([]),
  hasMopedLicense: z.boolean().default(false),
  doesVolunteering: z.boolean().default(false),
});
export type StudentProfile = z.infer<typeof studentProfileSchema>;

/** Colonnes de la table students correspondantes (snake_case). */
export function toStudentRow(p: StudentProfile) {
  return {
    ...(p.communeId ? { commune_id: p.communeId } : {}),
    school_year: p.schoolYear ?? null,
    grades: p.average !== undefined ? { average: p.average } : {},
    aptitude_tests: p.aptitudeTests,
    trial_internships: p.trialInternships,
    languages: p.languages,
    interests: p.interests,
    soft_skills: p.softSkills,
    has_moped_license: p.hasMopedLicense,
    does_volunteering: p.doesVolunteering,
  };
}

export const CV_MAX_BYTES = 10 * 1024 * 1024;
