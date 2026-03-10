import { useState, useRef, useEffect, useCallback } from 'react';
import type { Post, StoredImage, LinkPreview } from '@/types';
import { extractFirstUrl, fetchLinkPreview } from '@/services/linkPreview';

interface ComposeBarProps {
  onSubmit: (post: Post, image?: StoredImage) => void;
}

export function ComposeBar({ onSubmit }: ComposeBarProps) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [linkPreview, setLinkPreview] = useState<LinkPreview | null>(null);
  const [fetchingLink, setFetchingLink] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFetchedUrl = useRef<string | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }, [text]);

  // Auto-detect URLs and fetch preview
  useEffect(() => {
    const url = extractFirstUrl(text);
    if (!url || url === lastFetchedUrl.current) return;

    lastFetchedUrl.current = url;
    setFetchingLink(true);

    fetchLinkPreview(url).then((preview) => {
      setLinkPreview(preview);
      setFetchingLink(false);
    });
  }, [text]);

  // Clear link preview if URL removed from text
  useEffect(() => {
    const url = extractFirstUrl(text);
    if (!url && linkPreview) {
      setLinkPreview(null);
      lastFetchedUrl.current = null;
    }
  }, [text, linkPreview]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);
  }, []);

  const clearImage = useCallback(() => {
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [imagePreviewUrl]);

  const handleSubmit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;

    const now = Date.now();
    let storedImage: StoredImage | undefined;
    let imageId: string | undefined;

    if (imageFile) {
      imageId = crypto.randomUUID();
      const blob = imageFile;
      storedImage = {
        id: imageId,
        blob,
        mimeType: imageFile.type,
        createdAt: now,
      };
    }

    const hasLink = linkPreview !== null;
    const postType = imageFile ? 'image' : hasLink ? 'link' : 'text';

    const post: Post = {
      id: crypto.randomUUID(),
      type: postType,
      createdAt: now,
      text: trimmed || undefined,
      imageId,
      link: linkPreview || undefined,
    };

    onSubmit(post, storedImage);

    // Reset state
    setText('');
    clearImage();
    setLinkPreview(null);
    lastFetchedUrl.current = null;

    // Refocus textarea
    textareaRef.current?.focus();
  }, [text, imageFile, linkPreview, onSubmit, clearImage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const hasContent = text.trim().length > 0 || imageFile !== null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-near-black/80 backdrop-blur-2xl border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Image preview */}
      {imagePreviewUrl && (
        <div className="px-4 pt-3 relative">
          <img
            src={imagePreviewUrl}
            alt="Preview"
            className="h-20 w-20 rounded-xl object-cover"
          />
          <button
            onClick={clearImage}
            className="absolute top-1 left-[5.5rem] w-7 h-7 bg-near-black/80 rounded-full flex items-center justify-center text-sm text-secondary-text"
          >
            ✕
          </button>
        </div>
      )}

      {/* Link preview */}
      {linkPreview && linkPreview.title && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 bg-card-bg/80 rounded-xl p-2 border border-white/[0.06]">
            {linkPreview.image && (
              <img
                src={linkPreview.image}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-primary-text truncate">
                {linkPreview.title}
              </p>
              <p className="text-xs text-secondary-text truncate">
                {linkPreview.siteName || linkPreview.url}
              </p>
            </div>
            <button
              onClick={() => {
                setLinkPreview(null);
                lastFetchedUrl.current = null;
              }}
              className="text-secondary-text text-sm px-2 py-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {fetchingLink && (
        <div className="px-4 pt-2">
          <p className="text-sm text-secondary-text">Fetching link preview...</p>
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-3 px-4 py-4">
        {/* Image upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full bg-card-bg/80 border border-white/[0.06] text-secondary-text hover:text-electric-blue transition-colors"
          aria-label="Add image"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What's on your mind?"
          rows={1}
          className="flex-1 bg-card-bg/80 border border-white/[0.06] rounded-2xl px-4 py-3 text-[17px] text-primary-text placeholder-secondary-text/50 focus:outline-none focus:border-electric-blue/40 transition-colors"
        />

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!hasContent}
          className={`flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-full transition-all duration-200 ${
            hasContent
              ? 'bg-electric-blue text-near-black'
              : 'bg-card-bg/80 border border-white/[0.06] text-secondary-text/40'
          }`}
          aria-label="Post"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
