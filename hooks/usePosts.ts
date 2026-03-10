import { useState, useEffect, useCallback, useRef } from 'react';
import type { Post, StoredImage } from '@/types';
import * as db from '@/services/db';

const PAGE_SIZE = 20;

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadingMore = useRef(false);
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  // Initial load
  useEffect(() => {
    db.getRecentPosts(PAGE_SIZE).then((loaded) => {
      setPosts(loaded);
      setHasMore(loaded.length === PAGE_SIZE);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load posts:', err);
      setError('Failed to load posts');
      setLoading(false);
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore.current || !hasMoreRef.current) return;
    loadingMore.current = true;

    const currentPosts = postsRef.current;
    const lastPost = currentPosts[currentPosts.length - 1];
    if (!lastPost) {
      loadingMore.current = false;
      return;
    }

    try {
      const older = await db.getRecentPosts(PAGE_SIZE, lastPost.createdAt);
      // Deduplicate in case of inclusive timestamp bound
      const existingIds = new Set(currentPosts.map((p) => p.id));
      const newPosts = older.filter((p) => !existingIds.has(p.id));
      setPosts((prev) => [...prev, ...newPosts]);
      setHasMore(older.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      loadingMore.current = false;
    }
  }, []);

  const addPost = useCallback(async (post: Post, image?: StoredImage) => {
    try {
      if (image) {
        await db.addImage(image);
      }
      try {
        await db.addPost(post);
      } catch (err) {
        // Rollback: delete orphaned image if post save failed
        if (image) {
          await db.deleteImage(image.id).catch(() => {});
        }
        throw err;
      }
      setPosts((prev) => [post, ...prev]);
    } catch (err) {
      console.error('Failed to save post:', err);
      setError('Failed to save post');
    }
  }, []);

  const removePost = useCallback(async (id: string) => {
    try {
      await db.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete post:', err);
      setError('Failed to delete post');
    }
  }, []);

  return { posts, loading, hasMore, error, loadMore, addPost, removePost };
}
