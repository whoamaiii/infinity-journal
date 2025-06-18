
export enum EntryType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video', // Conceptually a video, represented by a thumbnail image
  VOICE_MEMO = 'voice_memo', // Text input, styled as if dictated
}

export interface JournalEntry {
  id: string;
  type: EntryType;
  timestamp: string; // ISO string
  content: string; // User's text, or base64 data URI for media thumbnail
  mediaMimeType?: string; // e.g., 'image/png'
  geminiInsight?: string; // Analysis from Gemini
  originalFileName?: string; // For file uploads
  mood?: string; // Emoji representing the mood
}

export interface MediaFile {
  name: string;
  type: string; // Mime type
  base64: string;
}