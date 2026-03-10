import { useEffect, useRef } from 'react';
import type { Post } from '@/types';
import { PostCard } from './PostCard';
import { EmptyState } from './EmptyState';

interface FeedProps {
  posts: Post[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDelete: (id: string) => void;
}

export function Feed({ posts, loading, hasMore, onLoadMore, onDelete }: FeedProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-electric-blue/30 border-t-electric-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-3 pb-28 pt-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={onDelete} />
      ))}
      <div ref={sentinelRef} className="h-1" />
      {!hasMore && posts.length > PAGE_SIZE_HINT && (
        <p className="text-center text-xs text-secondary-text py-4">
          You've reached the beginning
        </p>
      )}
    </div>
  );
}

const PAGE_SIZE_HINT = 20;
