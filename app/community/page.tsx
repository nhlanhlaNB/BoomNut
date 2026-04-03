"use client"
import React, { useEffect, useState } from "react"

type Post = {
  id: string
  name: string
  message: string
  createdAt: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string) {
  const colors = [
    { bg: "#1a2744", text: "#6ea8fe" },
    { bg: "#1a2e22", text: "#4ade80" },
    { bg: "#2d1b36", text: "#c084fc" },
    { bg: "#2d1f0e", text: "#fb923c" },
    { bg: "#1f2d2d", text: "#2dd4bf" },
    { bg: "#2d1a1a", text: "#f87171" },
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
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

  useEffect(() => {
    fetchPosts()
  }, [])

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
    <div style={{ fontFamily: "'Berkeley Mono', 'Fira Code', 'JetBrains Mono', monospace" }}>
      <style>{`
        .post-compose {
          background: #111318;
          border: 1px solid #1e2330;
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
          margin-bottom: 24px;
        }
        .post-compose:focus-within {
          border-color: #2a3a6e;
        }
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
          background: #1a2744;
          color: #6ea8fe;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
          font-family: inherit;
        }
        .compose-name-input {
          background: transparent;
          border: none;
          outline: none;
          color: #e2e8f0;
          font-size: 13px;
          font-family: inherit;
          font-weight: 600;
          width: 180px;
          padding: 0;
        }
        .compose-name-input::placeholder { color: #3d4b6b; }
        .compose-body {
          padding: 12px 20px 16px 68px;
        }
        .compose-textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #cbd5e1;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          line-height: 1.6;
          min-height: 42px;
          box-sizing: border-box;
        }
        .compose-textarea::placeholder { color: #2d3a57; }
        .compose-footer {
          padding: 12px 20px;
          border-top: 1px solid #1a2030;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .compose-meta {
          font-size: 12px;
          color: #3d4b6b;
        }
        .compose-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .btn-clear {
          background: transparent;
          border: 1px solid #1e2a45;
          color: #4a5a80;
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-clear:hover { border-color: #2a3a6e; color: #6ea8fe; }
        .btn-post {
          background: #1a3a7a;
          border: 1px solid #2a4d9e;
          color: #6ea8fe;
          padding: 7px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-post:hover:not(:disabled) { background: #1e4490; color: #93c4ff; }
        .btn-post:disabled { opacity: 0.4; cursor: not-allowed; }

        .feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .feed-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #3d4b6b;
          text-transform: uppercase;
        }
        .feed-count {
          font-size: 11px;
          color: #2a3a57;
          background: #0e1420;
          border: 1px solid #1a2340;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .post-card {
          background: #0d1117;
          border: 1px solid #1a2030;
          border-radius: 12px;
          padding: 0;
          margin-bottom: 8px;
          overflow: hidden;
          transition: border-color 0.2s;
          animation: fadeSlideIn 0.3s ease both;
        }
        .post-card:hover { border-color: #1e2a45; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .post-inner {
          padding: 16px 20px;
        }
        .post-top {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .post-avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          font-family: inherit;
        }
        .post-author {
          font-size: 13px;
          font-weight: 700;
          color: #e2e8f0;
          font-family: inherit;
        }
        .post-dot {
          color: #1e2a45;
          font-size: 13px;
        }
        .post-time {
          font-size: 12px;
          color: #2d3d5e;
          font-family: inherit;
        }
        .post-body {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.7;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .post-body.truncated {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .post-footer {
          padding: 10px 20px;
          border-top: 1px solid #111820;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .post-action {
          font-size: 12px;
          color: #2d3d5e;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: color 0.15s;
          background: none;
          border: none;
          font-family: inherit;
          padding: 0;
        }
        .post-action:hover { color: #6ea8fe; }
        .post-action svg { width: 13px; height: 13px; }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          border: 1px dashed #1a2340;
          border-radius: 12px;
        }
        .empty-icon {
          width: 40px;
          height: 40px;
          margin: 0 auto 16px;
          opacity: 0.15;
        }
        .empty-title {
          font-size: 14px;
          font-weight: 600;
          color: #2d3d5e;
          margin-bottom: 6px;
          font-family: inherit;
        }
        .empty-sub {
          font-size: 13px;
          color: #1e2a45;
          font-family: inherit;
        }

        .skeleton {
          background: linear-gradient(90deg, #0e1420 25%, #131b2b 50%, #0e1420 75%);
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite;
          border-radius: 6px;
          height: 14px;
          margin-bottom: 8px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton-card {
          background: #0d1117;
          border: 1px solid #1a2030;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 8px;
        }
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
              {message.length > 0 ? `${message.length} chars` : "markdown supported"}
            </span>
            <div className="compose-actions">
              <button
                className="btn-clear"
                onClick={() => { setName(""); setMessage(""); setFocused(false) }}
              >
                Cancel
              </button>
              <button
                className="btn-post"
                onClick={handleSubmit}
                disabled={loading || !message.trim()}
              >
                {loading ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="28" strokeDashoffset="8" />
                    </svg>
                    Posting
                  </>
                ) : (
                  <>Post</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="feed-header">
        <span className="feed-label">Latest posts</span>
        <span className="feed-count">{posts.length} {posts.length === 1 ? "post" : "posts"}</span>
      </div>

      {fetching ? (
        <>
          {[1, 2, 3].map((i) => (
            <div className="skeleton-card" key={i}>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#111820", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: "30%", height: 12 }} />
                  <div className="skeleton" style={{ width: "15%", height: 10 }} />
                </div>
              </div>
              <div className="skeleton" style={{ width: "90%" }} />
              <div className="skeleton" style={{ width: "70%" }} />
              <div className="skeleton" style={{ width: "50%", marginBottom: 0 }} />
            </div>
          ))}
        </>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="18" stroke="#6ea8fe" strokeWidth="1.5" />
            <path d="M12 20h16M20 12v16" stroke="#6ea8fe" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="empty-title">No posts yet</p>
          <p className="empty-sub">Be the first to start the conversation</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {posts.map((p, i) => {
            const colors = getAvatarColor(p.name)
            const isLong = p.message.length > 280
            const isExpanded = expandedPost === p.id
            return (
              <li
                key={p.id}
                className="post-card"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="post-inner">
                  <div className="post-top">
                    <div
                      className="post-avatar"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {getInitials(p.name)}
                    </div>
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
                  <button className="post-action">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 2a6 6 0 110 12A6 6 0 018 2zM8 5v3l2 2" strokeLinecap="round" />
                    </svg>
                    {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </button>
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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
