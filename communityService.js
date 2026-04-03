import { 
  collection, 
  addDoc, 
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebaseConfig';

/**
 * Creates a new post within a specific community.
 */
export const createPost = async (communityId, title, content) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");

  return await addDoc(collection(db, 'posts'), {
    communityId,
    title,
    content,
    authorId: user.uid,
    authorName: user.displayName || user.email,
    createdAt: serverTimestamp(),
    voteCount: 0
  });
};

/**
 * Adds a comment to a specific post.
 */
export const addComment = async (postId, text, parentId = null) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");

  return await addDoc(collection(db, 'comments'), {
    postId,
    parentId, // Support for nested threads
    text,
    authorId: user.uid,
    authorName: user.displayName || user.email,
    createdAt: serverTimestamp()
  });
};

/**
 * Handles upvoting (1) and downvoting (-1).
 * Prevents double voting by tracking user IDs in a sub-collection.
 */
export const votePost = async (postId, direction) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");

  const voteRef = doc(db, 'posts', postId, 'votes', user.uid);
  const postRef = doc(db, 'posts', postId);
  
  const voteSnap = await getDoc(voteRef);
  const existingVote = voteSnap.exists() ? voteSnap.data().direction : 0;

  if (existingVote === direction) {
    // If user clicks the same arrow again, remove the vote
    await deleteDoc(voteRef);
    await updateDoc(postRef, { voteCount: increment(-direction) });
  } else {
    // New vote or flipping from up to down
    await setDoc(voteRef, { direction });
    const change = direction - existingVote;
    await updateDoc(postRef, { voteCount: increment(change) });
  }
};

/**
 * Fetches details for a single post.
 */
export const getPost = async (postId) => {
  const postSnap = await getDoc(doc(db, 'posts', postId));
  if (!postSnap.exists()) return null;
  return { id: postSnap.id, ...postSnap.data() };
};

/**
 * Listens for new posts in a community in real-time.
 * @param {string} communityId 
 * @param {function} callback - Function called with updated posts array
 */
export const subscribeToCommunityPosts = (communityId, callback) => {
  const q = query(
    collection(db, 'posts'),
    where('communityId', '==', communityId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(posts);
  });
};

/**
 * Listens for comments on a post.
 */
export const subscribeToComments = (postId, callback) => {
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(comments);
  });
};