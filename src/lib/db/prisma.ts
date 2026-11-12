/**
 * The process-wide Prisma client: the server's only connection to PostgreSQL.
 *
 * Shared kernel (D1): route handlers, server pages and server modules all use
 * this one instance. Outside production it is parked on `globalThis` because
 * hot reload re-evaluates this module, and each new `PrismaClient` would open
 * another connection pool.
 *
 * @module db/prisma
 */
import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
