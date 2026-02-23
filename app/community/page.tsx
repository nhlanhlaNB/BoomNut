"use client"
import React, { useEffect, useState } from "react"

type Post = {
  id: string
  name: string
  message: string
  createdAt: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      const res = await fetch("/api/community")
      if (!res.ok) throw new Error("Failed to load posts")
      const data = await res.json()
      setPosts((data || []).slice().reverse())
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Anonymous", message: message.trim() }),
      })
      if (!res.ok) throw new Error("Failed to post")
      setName("")
      setMessage("")
      await fetchPosts()
    } catch (err) {
      console.error(err)
      alert("Could not post message. Check console for details.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-semibold mb-4">Community</h1>
      <p className="text-sm text-gray-600 mb-6">Share thoughts, ask questions, and help each other.</p>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          className="w-full mb-2 px-3 py-2 border rounded-md"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="w-full mb-2 px-3 py-2 border rounded-md min-h-[100px]"
          placeholder="Write a message to the community..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60"
          >
            {loading ? "Posting..." : "Post"}
          </button>
          <button
            type="button"
            onClick={() => { setName(""); setMessage("") }}
            className="px-3 py-2 border rounded-md"
          >
            Clear
          </button>
        </div>
      </form>

      <section>
        <h2 className="text-xl font-medium mb-3">Recent posts</h2>
        {posts.length === 0 && <p className="text-sm text-gray-500">No posts yet — be the first!</p>}
        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.id} className="border rounded-md p-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-600">{new Date(p.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{p.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
