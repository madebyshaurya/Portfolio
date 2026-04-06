import { auth } from "@/auth";
import { list, put } from "@vercel/blob";
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

interface GuestbookEntry {
  id: string;
  username: string;
  avatar: string;
  message: string;
  createdAt: string;
  signature?: string;
  signatureText?: string;
}

const MIN_POST_INTERVAL_MS = 30_000;
const DUPLICATE_WINDOW_MS = 10 * 60_000;

async function readEntries(): Promise<GuestbookEntry[]> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { blobs } = await list({ prefix: GUESTBOOK_PREFIX });

    const entries = await Promise.all(
      blobs.map(async (blob) => {
        const response = await fetch(blob.url, { cache: "no-store" });
        return (await response.json()) as GuestbookEntry;
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
            access: "public",
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
    const entries = await readEntries();
    return NextResponse.json(entries);
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
    const normalizedMessage = typeof message === "string" ? message.trim() : "";
    const authorName = session.user.name || session.user.email || "anonymous";
    const authorKey = authorName.toLowerCase();

    if (!message || typeof message !== "string" || normalizedMessage.length === 0) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }
    if (
      badWords.check(normalizedMessage) ||
      BLOCKED_PATTERNS.some((pattern) => pattern.test(normalizedMessage))
    ) {
      return NextResponse.json(
        { error: "That note can’t be posted." },
        { status: 400 }
      );
    }
    if (
      signature !== undefined &&
      (typeof signature !== "string" ||
        !/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(signature) ||
        signature.length > 250_000)
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
    if (
      signatureText !== undefined &&
      (typeof signatureText !== "string" || signatureText.trim().length > 48)
    ) {
      return NextResponse.json({ error: "Invalid signature text" }, { status: 400 });
    }

    const entries = await readEntries();
    const latestByAuthor = entries.find(
      (entry) => entry.username.toLowerCase() === authorKey
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
        entry.username.toLowerCase() === authorKey &&
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
