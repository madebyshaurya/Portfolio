import { del, get, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "presence.json");
const PRESENCE_PREFIX = "presence/sessions/";
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

async function readSessions(): Promise<PresenceSession[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { blobs } = await list({ prefix: PRESENCE_PREFIX });
    const sessions = await Promise.all(
      blobs.map(async (blob) => {
        const result = await get(blob.pathname, {
          access: "private",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          useCache: false,
        });
        if (!result || result.statusCode !== 200) {
          throw new Error(`Missing presence blob: ${blob.pathname}`);
        }
        return (await new Response(result.stream).json()) as PresenceSession;
      })
    );
    return sessions;
  }

  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSessions(sessions: PresenceSession[]) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { blobs } = await list({ prefix: PRESENCE_PREFIX });
    if (blobs.length > 0) {
      await del(blobs.map((blob) => blob.url));
    }

    await Promise.all(
      sessions.map((session) =>
        put(
          `${PRESENCE_PREFIX}${session.id}.json`,
          JSON.stringify(session),
          {
            access: "private",
            addRandomSuffix: false,
            contentType: "application/json",
          }
        )
      )
    );
    return;
  }

  await fs.writeFile(DATA_FILE, JSON.stringify(sessions, null, 2));
}

function getActiveSessions(sessions: PresenceSession[]) {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  return sessions.filter(
    (session) => new Date(session.lastSeenAt).getTime() >= cutoff
  );
}

export async function GET() {
  const sessions = await readSessions();
  const active = getActiveSessions(sessions);

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

  if (active.length !== sessions.length) {
    await writeSessions(active);
  }

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
  const sessions = await readSessions();
  const active = getActiveSessions(sessions).filter((s) => s.id !== sessionId);

  active.push({
    id: sessionId,
    countryCode,
    countryName,
    lastSeenAt: new Date().toISOString(),
  });

  await writeSessions(active);

  return NextResponse.json({ ok: true });
}
