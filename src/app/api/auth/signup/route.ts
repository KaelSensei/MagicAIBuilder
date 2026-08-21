import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { readJsonBody } from "@/lib/api/json-body";

const RATE_LIMIT = 5; // max signup attempts
const RATE_WINDOW = 15 * 60_000; // per 15 minutes per IP

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email().max(255),
  password: z.string().min(8).max(128),
});

/** POST /api/auth/signup — Register a new user with email + password */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`signup:${ip}`, RATE_LIMIT, RATE_WINDOW);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.value;
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.issues.map((i) => i.message) },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { id: user.id, name: user.name, email: user.email },
      { status: 201 }
    );
  } catch (error) {
    logger.error(error instanceof Error ? error.message : "unknown", "POST /api/auth/signup");
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
