import { openDB, type IDBPDatabase } from 'idb';
import type { Post, StoredImage } from '@/types';

const DB_NAME = 'infinity-journal';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const postStore = db.createObjectStore('posts', { keyPath: 'id' });
        postStore.createIndex('by-date', 'createdAt');
        db.createObjectStore('images', { keyPath: 'id' });
      },
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function addPost(post: Post): Promise<void> {
  const db = await getDB();
  await db.put('posts', post);
}

export async function deletePost(id: string): Promise<void> {
  const db = await getDB();
  const post = await db.get('posts', id);
  if (post?.imageId) {
    await db.delete('images', post.imageId);
  }
  await db.delete('posts', id);
}

export async function getRecentPosts(
  count: number,
  beforeTimestamp?: number
): Promise<Post[]> {
  const db = await getDB();
  const tx = db.transaction('posts', 'readonly');
  const index = tx.store.index('by-date');

  const posts: Post[] = [];
  const range = beforeTimestamp
    ? IDBKeyRange.upperBound(beforeTimestamp)
    : undefined;

  let cursor = await index.openCursor(range, 'prev');
  while (cursor && posts.length < count) {
    posts.push(cursor.value as Post);
    cursor = await cursor.continue();
  }

  await tx.done;
  return posts;
}

export async function addImage(image: StoredImage): Promise<void> {
  const db = await getDB();
  await db.put('images', image);
}

export async function getImage(id: string): Promise<StoredImage | undefined> {
  const db = await getDB();
  return db.get('images', id);
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('images', id);
}
