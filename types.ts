export type PostType = 'text' | 'image' | 'link';

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  fetchedAt: number;
}

export interface Post {
  id: string;
  type: PostType;
  createdAt: number;
  text?: string;
  imageId?: string;
  link?: LinkPreview;
}

export interface StoredImage {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}
