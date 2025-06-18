# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Infinity Journal is a React-based journaling web application that allows users to create multi-format entries (text, voice, images, videos) with AI-powered insights using Google's Gemini AI.

**Tech Stack:**
- **Vite** - Build tool and development server
- **React 19.1.0** - UI framework with TypeScript
- **TailwindCSS** - Styling (loaded via CDN in production)
- **Google Gemini AI** - AI-powered content analysis and insights
- **TypeScript** - Type safety with strict mode enabled

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite on port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Create `.env.local` file with:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Architecture

The application uses a component-based architecture with centralized state management in App.tsx:

```
/
├── App.tsx                    # Main component with state management & UI layout
├── index.tsx                  # React entry point
├── index.html                 # HTML with import maps & Tailwind CDN
├── components/
│   ├── InputSystem.tsx        # FAB menu & modals for creating entries
│   └── JournalEntryCard.tsx   # Display component for journal entries
├── services/
│   └── geminiService.ts       # Gemini AI API integration
├── types.ts                   # TypeScript interfaces (JournalEntry, MediaFile)
├── constants.ts               # AI prompts and app constants
└── vite.config.ts            # Vite config with env variable handling
```

## Key Features & Implementation

### Entry Types
- **Text Notes**: Standard text entries with mood detection
- **Voice Memos**: Uses browser Speech Recognition API
- **Images**: Uploads analyzed by Gemini AI
- **Videos**: Thumbnail extraction with AI analysis

### AI Integration
All AI features are implemented in `services/geminiService.ts`:
- `suggestMood(text)` - Analyzes text sentiment
- `analyzeImage(base64Data)` - Describes uploaded images
- `summarizeJournal(entries)` - Generates overall journal summary

### Data Storage
- Uses localStorage for persistence
- Key: `'infinityJournal_entries'`
- Data format: Array of JournalEntry objects

## Development Guidelines

### Adding New Entry Types
1. Update `EntryType` enum in `types.ts`
2. Add new case in `InputSystem.tsx` render method
3. Create corresponding modal component
4. Update `JournalEntryCard.tsx` to handle display

### Working with AI Features
- All prompts are centralized in `constants.ts`
- Gemini service handles errors gracefully with fallbacks
- API key is accessed via `import.meta.env.GEMINI_API_KEY`

### Styling
- Use Tailwind classes (loaded via CDN)
- Dark theme with electric blue (#00ffff) accents
- Maintain glassmorphism effect with backdrop-blur

## Browser APIs Used
- **FileReader API** - For file uploads
- **Web Speech API** - For voice dictation (optional)
- **Navigator.mediaDevices** - For microphone access

## Testing Approach

No formal test setup currently exists. To test:
1. Use sample entries in `App.tsx` for UI development
2. Test AI features with valid Gemini API key
3. Verify localStorage persistence across sessions

## Known Considerations

1. **No CSS files**: All styling via Tailwind CDN and inline styles
2. **Import maps**: Dependencies loaded via browser import maps, not bundled
3. **Media storage**: Images/videos stored as base64 in localStorage (size limitations apply)
4. **Browser support**: Requires modern browser with ES Module support