import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { getUser, type User } from "@/lib/desk";

const COOKIE = "aura_session";
const SECRET = process.env.AURA_SECRET || "aura-local-dev-secret";

function sign(value: string) {
  const body = Buffer.from(value).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function readToken(token: string | undefined) {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = createHmac("sha256", SECRET).update(body).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return Buffer.from(body, "base64url").toString("utf8");
}

export async function currentUser(): Promise<User | null> {
  const jar = await cookies();
  const userId = readToken(jar.get(COOKIE)?.value);
  if (!userId) return null;
  return getUser(userId);
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function staff(user: User | null) {
  return user?.role === "agent" || user?.role === "administrator" || user?.role === "super";
}
