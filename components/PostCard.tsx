import { useState, useEffect } from 'react';
import type { Post } from '@/types';
import { getImage } from '@/services/db';

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: days > 365 ? 'numeric' : undefined,
  });
}

interface PostCardProps {
  post: Post;
  onDelete: (id: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (!post.imageId) return;
    let revoked = false;
    getImage(post.imageId).then((img) => {
      if (img && !revoked) {
        const url = URL.createObjectURL(img.blob);
        setImageUrl(url);
      }
    });
    return () => {
      revoked = true;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [post.imageId]);

  return (
    <div
      className="bg-card-bg/95 rounded-2xl p-5 shadow-lg shadow-black/20 transition-all duration-200"
      onClick={() => setShowDelete((s) => !s)}
    >
      {/* Timestamp + delete */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-secondary-text">
          {timeAgo(post.createdAt)}
        </span>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(post.id);
            }}
            className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-2 -mr-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            Delete
          </button>
        )}
      </div>

      {/* Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="w-full rounded-xl object-cover max-h-80 mb-3"
          loading="lazy"
        />
      )}

      {/* Link preview */}
      {post.link && (
        <a
          href={post.link.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block rounded-xl overflow-hidden mb-3 bg-near-black/40 hover:bg-near-black/50 transition-colors"
        >
          {post.link.image && (
            <img
              src={post.link.image}
              alt=""
              className="w-full h-52 object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="p-4">
            {post.link.siteName && (
              <p className="text-xs text-electric-blue/70 mb-1 uppercase tracking-wide">
                {post.link.siteName}
              </p>
            )}
            {post.link.title && (
              <p className="text-base font-semibold text-primary-text leading-snug mb-1">
                {post.link.title}
              </p>
            )}
            {post.link.description && (
              <p className="text-sm text-secondary-text line-clamp-2">
                {post.link.description}
              </p>
            )}
            {!post.link.title && (
              <p className="text-base text-electric-blue truncate">
                {post.link.url}
              </p>
            )}
          </div>
        </a>
      )}

      {/* Text */}
      {post.text && (
        <p className="text-primary-text text-[17px] leading-relaxed whitespace-pre-wrap break-words">
          {post.text}
        </p>
      )}
    </div>
  );
}
