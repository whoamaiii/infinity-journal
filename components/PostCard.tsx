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
      className="bg-card-bg border border-border-subtle rounded-xl p-4 transition-colors duration-200"
      onClick={() => setShowDelete((s) => !s)}
    >
      {/* Timestamp + delete */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-secondary-text">
          {timeAgo(post.createdAt)}
        </span>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(post.id);
            }}
            className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 -mr-2"
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
          className="w-full rounded-lg object-cover max-h-80 mb-3"
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
          className="block border border-border-subtle rounded-lg overflow-hidden mb-3 hover:border-electric-blue/30 transition-colors"
        >
          {post.link.image && (
            <img
              src={post.link.image}
              alt=""
              className="w-full h-40 object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="p-3">
            {post.link.siteName && (
              <p className="text-xs text-electric-blue/70 mb-1 uppercase tracking-wide">
                {post.link.siteName}
              </p>
            )}
            {post.link.title && (
              <p className="text-sm font-medium text-primary-text leading-snug mb-1">
                {post.link.title}
              </p>
            )}
            {post.link.description && (
              <p className="text-xs text-secondary-text line-clamp-2">
                {post.link.description}
              </p>
            )}
            {!post.link.title && (
              <p className="text-sm text-electric-blue truncate">
                {post.link.url}
              </p>
            )}
          </div>
        </a>
      )}

      {/* Text */}
      {post.text && (
        <p className="text-primary-text text-sm leading-relaxed whitespace-pre-wrap break-words">
          {post.text}
        </p>
      )}
    </div>
  );
}
