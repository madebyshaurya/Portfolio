import { auth } from "@/auth";
import { del, get, list, put } from "@vercel/blob";
import BadWordsNext from "bad-words-next";
import en from "bad-words-next/lib/en";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "guestbook.json");
const GUESTBOOK_PREFIX = "guestbook/entries/";
const BLOCKED_PATTERNS = [
  /\bn[i1!|l]+g+([ea3@]+|er|a)\b/i,
  /\bf[a4@]+g+\b/i,
];
const badWords = new BadWordsNext({ data: en });
const ADMIN_USERNAMES = new Set(["madebyshaurya"]);

interface GuestbookEntry {
  id: string;
  username: string;
  avatar: string;
  message: string;
  createdAt: string;
  authorKey?: string;
  signature?: string;
  signatureText?: string;
}

interface GuestbookResponseEntry extends Omit<GuestbookEntry, "authorKey"> {
  canManage: boolean;
}

const MIN_POST_INTERVAL_MS = 30_000;
const DUPLICATE_WINDOW_MS = 10 * 60_000;

function getAuthorKey(user: { name?: string | null; email?: string | null }) {
  return (user.email || user.name || "anonymous").toLowerCase();
}

function getUsername(user: { username?: string | null }) {
  return user.username?.toLowerCase() || "";
}

function isAdminUser(user: { username?: string | null }) {
  return ADMIN_USERNAMES.has(getUsername(user));
}

function canManageEntry(
  entry: GuestbookEntry,
  viewerKey: string,
  viewerName?: string | null,
  viewerIsAdmin = false
) {
  if (!viewerKey) return false;
  if (viewerIsAdmin) return true;
  return (
    entry.authorKey === viewerKey ||
    (!entry.authorKey &&
      (entry.username.toLowerCase() === viewerKey ||
        (!!viewerName && entry.username.toLowerCase() === viewerName.toLowerCase())))
  );
}

function getEntryPath(entry: Pick<GuestbookEntry, "createdAt" | "id">) {
  return `${GUESTBOOK_PREFIX}${String(9_999_999_999_999 - new Date(entry.createdAt).getTime()).padStart(13, "0")}-${entry.id}.json`;
}

function validatePayload(message: unknown, signature: unknown, signatureText: unknown) {
  const normalizedMessage = typeof message === "string" ? message.trim() : "";

  if (typeof message !== "string" || normalizedMessage.length === 0) {
    return { error: "Message required", status: 400 as const };
  }
  if (
    badWords.check(normalizedMessage) ||
    BLOCKED_PATTERNS.some((pattern) => pattern.test(normalizedMessage))
  ) {
    return { error: "That note can’t be posted.", status: 400 as const };
  }
  if (
    signature !== undefined &&
    (typeof signature !== "string" ||
      !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(signature) ||
      signature.length > 250_000)
  ) {
    return { error: "Invalid signature", status: 400 as const };
  }
  if (
    signatureText !== undefined &&
    (typeof signatureText !== "string" || signatureText.trim().length > 48)
  ) {
    return { error: "Invalid signature text", status: 400 as const };
  }

  return { normalizedMessage };
}

async function readEntries(): Promise<GuestbookEntry[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { blobs } = await list({ prefix: GUESTBOOK_PREFIX });

    const entries = await Promise.all(
      blobs.map(async (blob) => {
        const result = await get(blob.pathname, {
          access: "private",
          token: process.env.BLOB_READ_WRITE_TOKEN,
          useCache: false,
        });
        if (!result || result.statusCode !== 200) {
          throw new Error(`Missing guestbook blob: ${blob.pathname}`);
        }
        return (await new Response(result.stream).json()) as GuestbookEntry;
      })
    );

    return entries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeEntries(entries: GuestbookEntry[]) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await Promise.all(
      entries.map((entry) =>
        put(
          `${GUESTBOOK_PREFIX}${String(9_999_999_999_999 - new Date(entry.createdAt).getTime()).padStart(13, "0")}-${entry.id}.json`,
          JSON.stringify(entry),
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

  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
}

export async function GET() {
  try {
    const session = await auth();
    const viewerKey = session?.user ? getAuthorKey(session.user) : "";
    const viewerName = session?.user?.name || "";
    const viewerIsAdmin = session?.user
      ? isAdminUser(session.user as { username?: string | null })
      : false;
    const entries = await readEntries();
    const response: GuestbookResponseEntry[] = entries.map(({ authorKey, ...entry }) => ({
      ...entry,
      canManage: canManageEntry(
        { ...entry, authorKey },
        viewerKey,
        viewerName,
        viewerIsAdmin
      ),
    }));
    return NextResponse.json(response);
  } catch (error) {
    console.error("Guestbook GET failed", error);
    return NextResponse.json(
      { error: "Couldn’t load guestbook right now." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { message, signature, signatureText } = await req.json();
    const authorName = session.user.name || session.user.email || "anonymous";
    const authorKey = getAuthorKey(session.user);
    const viewerName = session.user.name || "";
    const viewerIsAdmin = isAdminUser(session.user as { username?: string | null });
    const validation = validatePayload(message, signature, signatureText);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }
    const { normalizedMessage } = validation;

    const entries = await readEntries();
    const latestByAuthor = entries.find(
      (entry) => canManageEntry(entry, authorKey, viewerName, viewerIsAdmin)
    );

    if (
      latestByAuthor &&
      Date.now() - new Date(latestByAuthor.createdAt).getTime() < MIN_POST_INTERVAL_MS
    ) {
      return NextResponse.json(
        { error: "Please wait a bit before posting again." },
        { status: 429 }
      );
    }

    const duplicate = entries.find(
      (entry) =>
        canManageEntry(entry, authorKey, viewerName, viewerIsAdmin) &&
        entry.message.trim().toLowerCase() === normalizedMessage.toLowerCase() &&
        Date.now() - new Date(entry.createdAt).getTime() < DUPLICATE_WINDOW_MS
    );

    if (duplicate) {
      return NextResponse.json(
        { error: "That note was already posted recently." },
        { status: 409 }
      );
    }

    const entry: GuestbookEntry = {
      id: Date.now().toString(36),
      username: authorName,
      avatar: session.user.image || "",
      message: normalizedMessage.slice(0, 200),
      createdAt: new Date().toISOString(),
      authorKey,
      signature: signature || undefined,
      signatureText: signatureText?.trim() || undefined,
    };

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await writeEntries([entry]);
    } else {
      entries.unshift(entry);
      await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Guestbook POST failed", error);
    return NextResponse.json(
      { error: "Couldn’t post note right now." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, message, signature, signatureText } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing note id" }, { status: 400 });
    }

    const validation = validatePayload(message, signature, signatureText);
    if ("error" in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const entries = await readEntries();
    const existing = entries.find((entry) => entry.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const authorKey = getAuthorKey(session.user);
    const viewerName = session.user.name || "";
    const viewerIsAdmin = isAdminUser(session.user as { username?: string | null });
    if (!canManageEntry(existing, authorKey, viewerName, viewerIsAdmin)) {
      return NextResponse.json({ error: "You can’t edit this note." }, { status: 403 });
    }

    const updated: GuestbookEntry = {
      ...existing,
      message: validation.normalizedMessage.slice(0, 200),
      signature: typeof signature === "string" && signature.length > 0 ? signature : undefined,
      signatureText:
        typeof signatureText === "string" && signatureText.trim().length > 0
          ? signatureText.trim()
          : undefined,
      authorKey,
    };

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await put(getEntryPath(updated), JSON.stringify(updated), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
      });
    } else {
      const nextEntries = entries.map((entry) => (entry.id === id ? updated : entry));
      await fs.writeFile(DATA_FILE, JSON.stringify(nextEntries, null, 2));
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Guestbook PUT failed", error);
    return NextResponse.json(
      { error: "Couldn’t update note right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Missing note id" }, { status: 400 });
    }

    const entries = await readEntries();
    const existing = entries.find((entry) => entry.id === id);
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const authorKey = getAuthorKey(session.user);
    const viewerName = session.user.name || "";
    const viewerIsAdmin = isAdminUser(session.user as { username?: string | null });
    if (!canManageEntry(existing, authorKey, viewerName, viewerIsAdmin)) {
      return NextResponse.json({ error: "You can’t delete this note." }, { status: 403 });
    }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(getEntryPath(existing));
    } else {
      const nextEntries = entries.filter((entry) => entry.id !== id);
      await fs.writeFile(DATA_FILE, JSON.stringify(nextEntries, null, 2));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Guestbook DELETE failed", error);
    return NextResponse.json(
      { error: "Couldn’t delete note right now." },
      { status: 500 }
    );
  }
}
