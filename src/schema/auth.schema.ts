import { z } from "zod";

export const loginUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>;

export const registerUserSchema = z
  .object({
    confirmPassword: z.string().min(1),
  })
  .merge(loginUserSchema)
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
