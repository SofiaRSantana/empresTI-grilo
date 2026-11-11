import { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as typeof globalThis & { empresTiPrisma?: PrismaClient };

export const db = globalDatabase.empresTiPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalDatabase.empresTiPrisma = db;
