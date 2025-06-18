
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { JournalEntry, EntryType, MediaFile } from './types';
import { INITIAL_JOURNAL_ENTRIES_KEY } from './constants';
import JournalEntryCard from './components/JournalEntryCard';
import InputSystem from './components/InputSystem';
import { analyzeImage, generateJournalSummary } from './services/geminiService';

const initialEntriesData: JournalEntry[] = [
    {
      id: '1', type: EntryType.TEXT, timestamp: new Date('2024-10-12T10:00:00Z').toISOString(),
      content: "Just had a great brainstorming session for the new project. Feeling really inspired and motivated. The core idea is to simplify the user onboarding process and make it more intuitive.",
      mood: '🎉'
    },
    {
      id: '2', type: EntryType.VOICE_MEMO, timestamp: new Date('2024-10-11T14:30:00Z').toISOString(),
      content: "Voice memo: Reminder to pick up groceries after work. Need milk, eggs, and bread. Also, don't forget to call Sarah about the weekend plans.",
      mood: '🤔'
    },
    {
      id: '3', type: EntryType.IMAGE, timestamp: new Date('2024-10-10T18:00:00Z').toISOString(),
      content: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoXu0Qq4eA5NL3rD-oOL44Uss60C3LNKedvgOrNn3-f1l5SZh36gRXfBi_EdohAvvrSCtp-sDD0vZ5qwBqECNr-ZqP_-s-sGIHgjf1iO3VeSEPI2irMx3vdHLGmspbdQKYXHBmPOvvVyrUlcWtkZ93xj6slqbRGb_cjqxVf1gnQPIOAx8PmX2oEwwzhdBNtH0rS8FV2OnEsvy40KsILa3VfW6Q6Qxxw524lHiujMZeZKc63QzDNQUQCmr_Zr6TLNVt2_S0prlaWG0",
      mediaMimeType: 'image/jpeg', originalFileName: 'sunset_lake.jpg',
      geminiInsight: "This screenshot captures a moment of serene beauty, showcasing a vibrant sunset over a tranquil lake. The sky is ablaze with hues of orange, pink, and purple, reflecting off the calm waters below."
    },
     {
      id: '4', type: EntryType.VIDEO, timestamp: new Date('2024-10-09T09:15:00Z').toISOString(),
      content: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBfcH8z9aj7TvZb9OPla88dZpfo3JXAuFDkXyNf4Eht8U4N0d871KMbrnpM5hdxuz5lEgxH9DFQ6XgtJ_Zj1QyugLLBVz3iwJUeu0sHzYgtSnVGwAdbVfuHpK7azVEwndRpzHQG8jHkI-viXKcOBB03A0muT97i2h_WSLKCdS2yVwvaWxWTeYjgt8_pHmcuzq4AkGuCQh7XvkTXlMiyECbw8f1IwmhFATuwlmtkosBXaj1VN6mUalXTXFfJxh76iJDS68FTCuCbOc",
      mediaMimeType: 'image/jpeg', // Using thumbnail image mimeType
      originalFileName: 'street_scene_video.mp4',
      geminiInsight: "This video snippet (represented by its thumbnail) captures a lively street scene in a bustling city. The camera likely pans across a diverse crowd of people, showcasing their interactions and movements."
    },
];

const SummaryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" height="24px" viewBox="0 0 24 24" width="24px" xmlns="http://www.w3.org/2000/svg">
    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM120,128V88a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm0,32h.08L120,160a8,8,0,1,1,0-16h0a8,8,0,0,1,0,16Z" transform="scale(1.0666)"/>
    <path fill="none" d="M0 0h24v24H0z"/>
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
  </svg>
);


const App: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryContent, setSummaryContent] = useState('');
  const mainContentRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);


  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem(INITIAL_JOURNAL_ENTRIES_KEY);
      if (storedEntries) {
        setEntries(JSON.parse(storedEntries));
      } else {
        // Sort initial sample data by timestamp descending for initial display
        setEntries(initialEntriesData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (e) {
      console.error("Failed to load entries from local storage", e);
      setEntries(initialEntriesData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(INITIAL_JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
    if (!isInitialLoad.current && mainContentRef.current) {
        mainContentRef.current.scrollTop = 0;
    }
    if(isInitialLoad.current) isInitialLoad.current = false;

  }, [entries]);

  const handleAddEntry = useCallback(async (type: EntryType, data: string | MediaFile, additionalData?: { mood?: string }) => {
    setIsLoading(true);
    setError(null);
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      content: typeof data === 'string' ? data : data.base64,
      mediaMimeType: typeof data !== 'string' ? data.type : undefined,
      originalFileName: typeof data !== 'string' ? data.name : undefined,
      mood: additionalData?.mood,
    };

    try {
      if ((type === EntryType.IMAGE || type === EntryType.VIDEO) && typeof data !== 'string') {
        const insight = await analyzeImage(data as MediaFile, type === EntryType.VIDEO);
        newEntry.geminiInsight = insight;
      }
      
      setEntries(prevEntries => [newEntry, ...prevEntries]);
    } catch (e: any) {
      console.error("Error adding entry:", e);
      setError(e.message || 'Failed to process entry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDeleteEntry = useCallback((id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  }, []);


  const handleGenerateSummary = async () => {
    setIsLoading(true);
    setError(null);
    setShowSummaryModal(true);
    setSummaryContent('Generating summary...');

    const entriesForSummary = [...entries].reverse(); 

    const relevantText = entriesForSummary
      .map(entry => {
        let text = `[${new Date(entry.timestamp).toLocaleDateString()} - ${entry.type}${entry.mood ? ` - Mood: ${entry.mood}` : ''}]: `;
        if (entry.type === EntryType.TEXT || entry.type === EntryType.VOICE_MEMO) {
          text += entry.content;
        } else if (entry.originalFileName) {
          text += `Media (${entry.originalFileName})`;
        }
        if (entry.geminiInsight) {
          text += `\nInsight: ${entry.geminiInsight}`;
        }
        return text;
      })
      .join('\n\n---\n\n');
    
    if (!relevantText.trim()) {
        setSummaryContent("No entries yet to summarize.");
        setIsLoading(false);
        return;
    }

    try {
      const summary = await generateJournalSummary(relevantText);
      setSummaryContent(summary);
    } catch (e: any) {
      console.error("Error generating summary:", e);
      setError(e.message || 'Failed to generate summary.');
      setSummaryContent(`Error: ${e.message || 'Failed to generate summary.'}`);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative flex flex-col min-h-screen bg-near-black text-gemini-title">
      <header className="sticky top-0 z-10 bg-near-black-80-backdrop backdrop-blur-md border-b border-border-color">
        <div className="flex items-center p-4 pb-3 justify-between">
          <div className="w-10"></div> {/* Spacer */}
          <h1 className="text-xl font-semibold leading-tight tracking-tight text-white text-center flex-1">
            Infinity Journal
          </h1>
          <button
            onClick={handleGenerateSummary}
            disabled={isLoading || entries.length === 0}
            className="flex items-center justify-center rounded-full h-10 w-10 text-electric-blue hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Generate Summary"
          >
            <SummaryIcon className="fill-electric-blue" />
          </button>
        </div>
      </header>

      <main ref={mainContentRef} className="flex-grow px-4 pt-4 pb-28 space-y-8 overflow-y-auto">
        {entries.length === 0 && !isLoading && (
          <div className="text-center text-light-gray py-10">
            <p className="text-xl">Your journal is empty.</p>
            <p>Tap the '+' button to add your first thought!</p>
          </div>
        )}
        {entries.map((entry) => (
          <JournalEntryCard key={entry.id} entry={entry} onDelete={handleDeleteEntry} />
        ))}
        {isLoading && entries.length === 0 && ( 
            <div className="text-center text-light-gray py-10">Loading entries...</div>
        )}
      </main>
      
      {error && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500 text-white p-3 rounded-md shadow-lg z-40 max-w-md w-full mx-4 text-sm">
          Error: {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold">X</button>
        </div>
      )}

      <InputSystem onAddEntry={handleAddEntry} isProcessing={isLoading} />
      
      <nav className="fixed bottom-0 left-0 right-0 bg-near-black-80-backdrop border-t border-border-color z-0">
        <div className="flex justify-around items-center h-16 px-2 safe-area-bottom">
           <div className="flex-1"></div>
           <div className="flex-1"></div>
           <div className="flex-1"></div>
        </div>
      </nav>

      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-card-bg p-6 rounded-lg shadow-xl w-full max-w-lg border border-border-color max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold text-gemini-title">Journal Summary</h2>
                 <button onClick={() => setShowSummaryModal(false)} className="text-light-gray hover:text-white text-2xl">&times;</button>
            </div>
            <div className="overflow-y-auto pr-2 space-y-3">
              {isLoading && summaryContent === 'Generating summary...' ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-electric-blue"></div>
                  <p className="ml-3 text-light-gray">Generating...</p>
                </div>
              ) : (
                <p className="text-sm text-light-gray whitespace-pre-wrap leading-relaxed">{summaryContent}</p>
              )}
            </div>
             <div className="mt-6 flex justify-end">
                <button
                    onClick={() => setShowSummaryModal(false)}
                    className="px-6 py-2 bg-electric-blue text-near-black font-semibold rounded-md hover:opacity-80 transition-opacity"
                >
                    Close
                </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
