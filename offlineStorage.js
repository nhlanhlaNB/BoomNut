import { openDB } from 'idb';

const DB_NAME = 'community-cache';
const STORE_NAME = 'posts';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  },
});

export const cachePosts = async (posts) => {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const post of posts) {
    tx.store.put(post);
  }
  await tx.done;
};

export const getCachedPosts = async () => {
  const db = await dbPromise;
  return db.getAll(STORE_NAME);
};