import React, { useEffect, useState } from 'react';
import { getPost, subscribeToComments, addComment } from './communityService';

export const PostView = ({ postId }) => {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    getPost(postId).then(setPost);
    const unsubscribe = subscribeToComments(postId, (data) => {
      // Build a tree structure from flat comments
      const commentMap = {};
      data.forEach(c => commentMap[c.id] = { ...c, children: [] });
      const tree = [];
      data.forEach(c => {
        if (c.parentId) commentMap[c.parentId]?.children.push(commentMap[c.id]);
        else tree.push(commentMap[c.id]);
      });
      setComments(tree);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await addComment(postId, newComment);
    setNewComment("");
  };

  if (!post) return <div>Loading Post...</div>;

  return (
    <div className="post-view">
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <hr />
      
      <form onSubmit={handleSubmit}>
        <textarea 
          value={newComment} 
          onChange={(e) => setNewComment(e.target.value)} 
          placeholder="What are your thoughts?"
        />
        <button type="submit">Comment</button>
      </form>

      <div className="comments-section">
        {comments.map(comment => <CommentNode key={comment.id} comment={comment} postId={postId} />)}
      </div>
    </div>
  );
};

const CommentNode = ({ comment, postId }) => (
  <div className="comment" style={{ marginLeft: '20px', borderLeft: '2px solid #eee', paddingLeft: '10px' }}>
    <p><strong>{comment.authorName}</strong>: {comment.text}</p>
    <button onClick={() => {
      const reply = prompt("Enter your reply:");
      if (reply) addComment(postId, reply, comment.id);
    }}>Reply</button>
    
    {comment.children && comment.children.map(child => (
      <CommentNode key={child.id} comment={child} postId={postId} />
    ))}
  </div>
);