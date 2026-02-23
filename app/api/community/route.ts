import { NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

const POSTS_PATH = path.join(process.cwd(), "public", "community-posts.json")

async function readPosts() {
  try {
    const raw = await fs.readFile(POSTS_PATH, "utf-8")
    return JSON.parse(raw)
  } catch (err: any) {
    if (err.code === "ENOENT") {
      await fs.mkdir(path.dirname(POSTS_PATH), { recursive: true }).catch(() => {})
      await fs.writeFile(POSTS_PATH, "[]")
      return []
    }
    throw err
  }
}

export async function GET() {
  try {
    const posts = await readPosts()
    return NextResponse.json(posts)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Unable to read posts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = body?.name || "Anonymous"
    const message = (body?.message || "").toString()
    if (!message.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 })
    }
    const posts = await readPosts()
    const post = {
      id: Date.now().toString(),
      name,
      message,
      createdAt: new Date().toISOString(),
    }
    posts.push(post)
    await fs.writeFile(POSTS_PATH, JSON.stringify(posts, null, 2), "utf-8")
    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Unable to save post" }, { status: 500 })
  }
}
