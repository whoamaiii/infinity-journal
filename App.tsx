import { Feed } from '@/components/Feed';
import { ComposeBar } from '@/components/ComposeBar';
import { usePosts } from '@/hooks/usePosts';
import type { Post, StoredImage } from '@/types';

export default function App() {
  const { posts, loading, hasMore, error, loadMore, addPost, removePost } = usePosts();

  const handleSubmit = (post: Post, image?: StoredImage) => {
    addPost(post, image);
    // Scroll to top to see the new post
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-near-black">
      {/* Header */}
      <header
        className="sticky top-0 z-20 bg-near-black/80 backdrop-blur-2xl border-b border-white/[0.06]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-5 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary-text tracking-tight">
            ♾️ Infinity Journal
          </h1>
        </div>
      </header>

      {/* Error toast */}
      {error && (
        <div className="px-4 pt-3">
          <p className="text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-3 text-center">
            {error}
          </p>
        </div>
      )}

      {/* Feed */}
      <main className="px-4">
        <Feed
          posts={posts}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onDelete={removePost}
        />
      </main>

      {/* Compose */}
      <ComposeBar onSubmit={handleSubmit} />
    </div>
  );
}
