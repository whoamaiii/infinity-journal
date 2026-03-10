import { useState, useEffect, useCallback, useRef } from 'react';
import type { Post, StoredImage } from '@/types';
import * as db from '@/services/db';

const PAGE_SIZE = 20;

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const loadingMore = useRef(false);

  // Initial load
  useEffect(() => {
    db.getRecentPosts(PAGE_SIZE).then((loaded) => {
      setPosts(loaded);
      setHasMore(loaded.length === PAGE_SIZE);
      setLoading(false);
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMore) return;
    loadingMore.current = true;

    const lastPost = posts[posts.length - 1];
    if (!lastPost) {
      loadingMore.current = false;
      return;
    }

    const older = await db.getRecentPosts(PAGE_SIZE, lastPost.createdAt);
    setPosts((prev) => [...prev, ...older]);
    setHasMore(older.length === PAGE_SIZE);
    loadingMore.current = false;
  }, [posts, hasMore]);

  const addPost = useCallback(async (post: Post, image?: StoredImage) => {
    if (image) {
      await db.addImage(image);
    }
    await db.addPost(post);
    setPosts((prev) => [post, ...prev]);
  }, []);

  const removePost = useCallback(async (id: string) => {
    await db.deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { posts, loading, hasMore, loadMore, addPost, removePost };
}
