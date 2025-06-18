
import React from 'react';
import { JournalEntry, EntryType } from '../types';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onDelete: (id: string) => void;
}

const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" height="16px" viewBox="0 0 256 256" width="16px" xmlns="http://www.w3.org/2000/svg">
    <path d="M128,176a48.05,48.05,0,0,0,48-48V64a48,48,0,0,0-96,0v64A48.05,48.05,0,0,0,128,176ZM96,64a32,32,0,0,1,64,0v64a32,32,0,0,1-64,0Zm40,143.6V232a8,8,0,0,1-16,0V207.6A80.11,80.11,0,0,1,48,128a8,8,0,0,1,16,0,64,64,0,0,0,128,0,8,8,0,0,1,16,0A80.11,80.11,0,0,1,136,207.6Z"></path>
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" height="48px" viewBox="0 0 256 256" width="48px" xmlns="http://www.w3.org/2000/svg">
    <path d="M240,128a15.71,15.71,0,0,1-7.6,13.51L88.32,229.65a16,16,0,0,1-24.32-13.51V40A16,16,0,0,1,88.32,26.4L232.4,114.45A15.71,15.71,0,0,1,240,128Z"></path>
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20" width="16px" height="16px" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
  </svg>
);


const JournalEntryCard: React.FC<JournalEntryCardProps> = ({ entry, onDelete }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    onDelete(entry.id);
  };

  return (
    <div className="relative bg-card-bg p-4 rounded-lg shadow-md border border-border-color space-y-3">
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1.5 text-light-gray hover:text-electric-blue transition-colors rounded-full hover:bg-white/10"
        aria-label="Delete entry"
      >
        <TrashIcon />
      </button>
      <div className="flex items-center pr-8"> {/* Container for date, mood, and mic icon */}
        <p className="text-sm text-light-gray">
          {entry.type === EntryType.VOICE_MEMO && <MicIcon className="inline mr-2 opacity-70 w-4 h-4" />}
          {formatDate(entry.timestamp)}
        </p>
        {entry.mood && (
            <span className="ml-2 text-xl" role="img" aria-label={`Mood: ${entry.mood}`}>
                {entry.mood}
            </span>
        )}
      </div>


      {entry.type === EntryType.TEXT && (
        <p className="text-gemini-title text-base leading-relaxed">{entry.content}</p>
      )}

      {entry.type === EntryType.VOICE_MEMO && (
        <p className="text-gemini-title text-base leading-relaxed">{entry.content}</p>
      )}

      {(entry.type === EntryType.IMAGE || entry.type === EntryType.VIDEO) && (
        <div className="space-y-2">
          {entry.content && (
             <div className="relative">
                <img 
                    src={entry.content} 
                    alt={entry.originalFileName || (entry.type === EntryType.IMAGE ? 'Journal image' : 'Video thumbnail')} 
                    className="w-full rounded-xl aspect-video object-cover" 
                />
                {entry.type === EntryType.VIDEO && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                        <PlayIcon className="text-white opacity-80" />
                    </div>
                )}
             </div>
          )}
          {entry.geminiInsight && (
            <div>
              <h3 className="text-gemini-title text-base font-semibold">Gemini Insight</h3>
              <p className="text-light-gray text-sm leading-relaxed">{entry.geminiInsight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalEntryCard;
