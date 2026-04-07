import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const HASH_KEY = "presence:sessions";
const ACTIVE_WINDOW_MS = 45_000;

interface PresenceSession {
  id: string;
  countryCode: string;
  countryName: string;
  lastSeenAt: string;
}

function getCountry(headers: Headers) {
  const countryCode =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    "CA";
  const countryName =
    headers.get("x-vercel-ip-country-name") ||
    countryCode;

  return { countryCode, countryName };
}

export async function GET() {
  const data = await redis.hgetall<Record<string, PresenceSession>>(HASH_KEY);
  const sessions = data ? Object.values(data) : [];

  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  const active = sessions.filter(
    (s) => new Date(s.lastSeenAt).getTime() >= cutoff
  );

  // Clean up expired sessions in the background
  const expired = sessions.filter(
    (s) => new Date(s.lastSeenAt).getTime() < cutoff
  );
  if (expired.length > 0) {
    redis.hdel(HASH_KEY, ...expired.map((s) => s.id)).catch(() => {});
  }

  const countries = active.reduce<Record<string, { code: string; name: string; count: number }>>(
    (acc, session) => {
      const key = session.countryCode;
      if (!acc[key]) {
        acc[key] = {
          code: session.countryCode,
          name: session.countryName,
          count: 0,
        };
      }
      acc[key].count += 1;
      return acc;
    },
    {}
  );

  return NextResponse.json({
    count: active.length,
    countries: Object.values(countries).sort((a, b) => b.count - a.count),
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;

  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 100) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const { countryCode, countryName } = getCountry(req.headers);

  const session: PresenceSession = {
    id: sessionId,
    countryCode,
    countryName,
    lastSeenAt: new Date().toISOString(),
  };

  await redis.hset(HASH_KEY, { [sessionId]: session });

  return NextResponse.json({ ok: true });
}
