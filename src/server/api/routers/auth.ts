import {
  loginUserSchema,
  registerUserSchema,
} from "../../../schema/auth.schema";
import { createTRPCRouter, publicProcedure } from "../trpc";
import * as bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const SALT_ROUNDS = 16;

const hashPassword = async (plainTextPassword: string) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const password = await bcrypt.hash(plainTextPassword, salt);
  return { password, salt };
};

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { username, password } = input;
      try {
        const { password: hashedPassword, salt } = await hashPassword(password);
        // Create User
        await ctx.prisma.user.create({
          data: {
            username,
            password: hashedPassword,
            salt,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            // Unique constaint failed
            throw new TRPCError({
              code: "CONFLICT",
              message: "Account already exists.",
            });
          }
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unable to register account.",
        });
      }
    }),
  login: publicProcedure
    .input(loginUserSchema)
    .mutation(async ({ ctx, input }) => {
      // Find user
      const { username, password } = input;
      const user = await ctx.prisma.user.findUnique({
        where: {
          username,
        },
      });
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found.",
        });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid credentials.",
        });
      }
      return user;
    }),
});
