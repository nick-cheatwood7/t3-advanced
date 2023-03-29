"use strict";
import { Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 16;

const hashPassword = async (/** @type {string} */ plainTextPassword) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const password = await bcrypt.hash(plainTextPassword, salt);
  return { password, salt };
};

const main = async () => {
  const username = "admin";
  const password = "admin";
  try {
    const { password: hashedPassword, salt } = await hashPassword(password);
    // Create User
    await prisma.user.create({
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
    console.error(error);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unable to register account.",
    });
  }
};

main();
