"use client"
import React, { useEffect, useState } from "react"

type Post = {
  id: string
  name: string
  message: string
  createdAt: string
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [focused, setFocused] = useState(false)
  const [expandedPost, setExpandedPost] = useState<string | null>(null)

  useEffect(() => { fetchPosts() }, [])

  async function fetchPosts() {
    setFetching(true)
    try {
      const res = await fetch("/api/community")
      if (!res.ok) throw new Error("Failed to load posts")
      const data = await res.json()
      setPosts((data || []).slice().reverse())
    } catch (e) {
      console.error(e)
    } finally {
      setFetching(false)
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
        body: JSON.stringify({ name: name.trim() || "Anonymous", message: message.trim() }),
      })
      if (!res.ok) throw new Error("Failed to post")
      setName("")
      setMessage("")
      setFocused(false)
      await fetchPosts()
    } catch (err) {
      console.error(err)
      alert("Could not post message.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .post-compose {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.15s;
          margin-bottom: 24px;
        }
        .post-compose:focus-within { border-color: #111; }

        .compose-header {
          padding: 16px 20px 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .compose-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .compose-name-input {
          background: transparent;
          border: none;
          outline: none;
          color: #111;
          font-size: 13px;
          font-weight: 600;
          width: 180px;
          padding: 0;
          font-family: inherit;
        }
        .compose-name-input::placeholder { color: #ccc; }

        .compose-body { padding: 10px 20px 14px 68px; }
        .compose-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #333;
          font-size: 14px;
          resize: none;
          line-height: 1.6;
          min-height: 40px;
          box-sizing: border-box;
          font-family: inherit;
        }
        .compose-textarea::placeholder { color: #ccc; }

        .compose-footer {
          padding: 10px 20px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .compose-meta { font-size: 12px; color: #bbb; }
        .compose-actions { display: flex; gap: 8px; align-items: center; }

        .btn-cancel {
          background: transparent;
          border: 1.5px solid #e5e7eb;
          color: #666;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.1s;
          font-family: inherit;
        }
        .btn-cancel:hover { border-color: #111; color: #111; }

        .btn-post {
          background: #111;
          border: 1.5px solid #111;
          color: #fff;
          padding: 6px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.1s;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }
        .btn-post:hover:not(:disabled) { background: #333; border-color: #333; }
        .btn-post:disabled { opacity: 0.3; cursor: not-allowed; }

        .feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .feed-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #aaa;
          text-transform: uppercase;
        }
        .feed-count {
          font-size: 11px;
          color: #aaa;
          background: #f9f9f9;
          border: 1px solid #e5e7eb;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .post-card {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          margin-bottom: 8px;
          overflow: hidden;
          transition: border-color 0.15s;
          animation: fadeSlideIn 0.25s ease both;
        }
        .post-card:hover { border-color: #111; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .post-inner { padding: 16px 20px; }
        .post-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .post-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .post-author { font-size: 13px; font-weight: 700; color: #111; }
        .post-dot { color: #ddd; }
        .post-time { font-size: 12px; color: #bbb; }

        .post-body {
          font-size: 14px;
          color: #444;
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
        }
        .post-body.truncated {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .post-footer {
          padding: 9px 20px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .post-action {
          font-size: 12px;
          color: #ccc;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: color 0.1s;
          background: none;
          border: none;
          font-family: inherit;
          padding: 0;
        }
        .post-action:hover { color: #111; }
        .post-action svg { width: 13px; height: 13px; }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          border: 1.5px dashed #e5e7eb;
          border-radius: 12px;
        }
        .empty-title { font-size: 14px; font-weight: 600; color: #ccc; margin-bottom: 6px; }
        .empty-sub { font-size: 13px; color: #ddd; }

        .skeleton {
          background: linear-gradient(90deg, #f3f4f6 25%, #eaebec 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 6px;
          height: 12px;
          margin-bottom: 8px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-card {
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Compose Box */}
      <div className="post-compose">
        <div className="compose-header">
          <div className="compose-avatar">
            {name.trim() ? getInitials(name.trim()) : "?"}
          </div>
          <input
            className="compose-name-input"
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocused(true)}
          />
        </div>
        <div className="compose-body">
          <textarea
            className="compose-textarea"
            placeholder="Share something with the community..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setFocused(true)}
            rows={focused || message ? 4 : 2}
          />
        </div>
        {(focused || message) && (
          <div className="compose-footer">
            <span className="compose-meta">
              {message.length > 0 ? `${message.length} chars` : "plain text"}
            </span>
            <div className="compose-actions">
              <button className="btn-cancel" onClick={() => { setName(""); setMessage(""); setFocused(false) }}>
                Cancel
              </button>
              <button className="btn-post" onClick={handleSubmit} disabled={loading || !message.trim()}>
                {loading ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" width="13" height="13" style={{ animation: "spin 0.8s linear infinite" }}>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="28" strokeDashoffset="8" />
                    </svg>
                    Posting
                  </>
                ) : "Post"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feed Header */}
      <div className="feed-header">
        <span className="feed-label">Latest posts</span>
        <span className="feed-count">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
      </div>

      {/* Posts */}
      {fetching ? (
        <>
          {[1, 2, 3].map((i) => (
            <div className="skeleton-card" key={i}>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e5e7eb", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: "28%" }} />
                  <div className="skeleton" style={{ width: "14%", height: 10 }} />
                </div>
              </div>
              <div className="skeleton" style={{ width: "92%" }} />
              <div className="skeleton" style={{ width: "72%" }} />
              <div className="skeleton" style={{ width: "48%", marginBottom: 0 }} />
            </div>
          ))}
        </>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No posts yet</p>
          <p className="empty-sub">Be the first to start the conversation</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {posts.map((p, i) => {
            const isLong = p.message.length > 280
            const isExpanded = expandedPost === p.id
            return (
              <li key={p.id} className="post-card" style={{ animationDelay: `${i * 35}ms` }}>
                <div className="post-inner">
                  <div className="post-top">
                    <div className="post-avatar">{getInitials(p.name)}</div>
                    <span className="post-author">{p.name}</span>
                    <span className="post-dot">·</span>
                    <span className="post-time">{timeAgo(p.createdAt)}</span>
                  </div>
                  <p className={`post-body ${isLong && !isExpanded ? "truncated" : ""}`}>
                    {p.message}
                  </p>
                  {isLong && (
                    <button
                      className="post-action"
                      style={{ marginTop: 8 }}
                      onClick={() => setExpandedPost(isExpanded ? null : p.id)}
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}
                </div>
                <div className="post-footer">
                  <span className="post-action" style={{ cursor: "default" }}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="8" cy="8" r="6" />
                      <path d="M8 5v3l2 1.5" strokeLinecap="round" />
                    </svg>
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <button className="post-action">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 8c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6H2l2-2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Reply
                  </button>
                  <button className="post-action">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11 3l2 2-2 2M3 8v-1a2 2 0 012-2h7M5 13l-2-2 2-2M13 8v1a2 2 0 01-2 2H4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Share
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
