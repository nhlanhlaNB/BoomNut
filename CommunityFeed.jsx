import React, { useEffect, useState } from 'react';
import { subscribeToCommunityPosts, votePost } from './communityService';
import { cachePosts, getCachedPosts } from './offlineStorage';

export const CommunityFeed = ({ communityId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Load from IndexedDB Cache first for instant UI
    getCachedPosts().then(cached => {
      if (cached.length > 0) {
        setPosts(cached.filter(p => p.communityId === communityId));
        setLoading(false);
      }
    });

    // 2. Subscribe to live Firestore updates
    const unsubscribe = subscribeToCommunityPosts(communityId, (updatedPosts) => {
      setPosts(updatedPosts);
      setLoading(false);
      // Update cache in the background
      cachePosts(updatedPosts);
    });

    return () => unsubscribe();
  }, [communityId]);

  if (loading && posts.length === 0) return <div>Loading Feed...</div>;

  return (
    <div className="community-feed">
      {posts.map(post => (
        <div key={post.id} className="post-card" style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <div className="vote-controls" style={{ float: 'left', marginRight: '15px', textAlign: 'center' }}>
            <button onClick={() => votePost(post.id, 1)}>▲</button>
            <div>{post.voteCount || 0}</div>
            <button onClick={() => votePost(post.id, -1)}>▼</button>
          </div>
          <div className="post-content">
            <h3>{post.title}</h3>
            <p>{post.content.substring(0, 100)}...</p>
            <small>Posted by {post.authorName}</small>
          </div>
        </div>
      ))}
    </div>
  );
};