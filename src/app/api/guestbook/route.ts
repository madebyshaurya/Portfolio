import { auth } from "@/auth";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "guestbook.json");

interface GuestbookEntry {
  id: string;
  username: string;
  avatar: string;
  message: string;
  createdAt: string;
  signature?: string;
}

async function readEntries(): Promise<GuestbookEntry[]> {
  try {
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeEntries(entries: GuestbookEntry[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(entries, null, 2));
}

export async function GET() {
  const entries = await readEntries();
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { message, signature } = await req.json();
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }
  if (
    signature !== undefined &&
    (typeof signature !== "string" ||
      !signature.startsWith("data:image/png;base64,") ||
      signature.length > 250_000)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const entries = await readEntries();
  const entry: GuestbookEntry = {
    id: Date.now().toString(36),
    username: session.user.name || "anonymous",
    avatar: session.user.image || "",
    message: message.trim().slice(0, 200),
    createdAt: new Date().toISOString(),
    signature: signature || undefined,
  };

  entries.unshift(entry);
  await writeEntries(entries);

  return NextResponse.json(entry, { status: 201 });
}
