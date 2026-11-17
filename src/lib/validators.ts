import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must contain at least 2 characters.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  password: z.string().min(10, "Password must be at least 10 characters.").max(128)
    .regex(/[A-Za-z]/, "Password must contain a letter.")
    .regex(/[0-9]/, "Password must contain a number.")
});

export const submissionSchema = z.object({
  assignmentId: z.string().optional().nullable(),
  submittedUrl: z.string().url("Please enter a valid URL."),
  confirmation: z.string().refine((val) => val === "on" || val === "true", {
    message: "You must confirm that the work is yours.",
  }),
  customLabName: z.string().optional().nullable(), // Naya field
});

export const reviewSchema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
  feedback: z.string().trim().max(2000).optional()
}).refine((data) => data.status !== "REJECTED" || Boolean(data.feedback), {
  message: "Feedback is required when rejecting a submission.",
  path: ["feedback"]
});
