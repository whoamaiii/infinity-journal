
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { EntryType, MediaFile } from '../types';
import { suggestMoodFromText, MOOD_EMOJI_LIST } from '../services/geminiService';

// Augment Window interface for SpeechRecognition APIs
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

// Debounce utility
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };

  return debounced;
};

// Mood options with labels for accessibility
const MOOD_OPTIONS: { emoji: string; label: string }[] = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '🎉', label: 'Excited' },
  { emoji: '😠', label: 'Angry' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '🤩', label: 'Star-struck' },
];


const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" height="32" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="32" xmlns="http://www.w3.org/2000/svg">
    <line x1="12" x2="12" y1="5" y2="19"></line>
    <line x1="5" x2="19" y1="12" y2="12"></line>
  </svg>
);

const MicFabIcon: React.FC<{ className?: string; isRecording?: boolean }> = ({ className, isRecording }) => (
    <svg className={className} fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      {isRecording ? (
        <>
          <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor"></rect>
        </>
      ) : (
        <>
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" x2="12" y1="19" y2="23"></line>
        </>
      )}
    </svg>
  );

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);

const VideoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="23 7 16 12 23 17 23 7"></polygon>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>
);

// Speech Recognition API - Renamed to avoid conflict with the SpeechRecognition interface
const BrowserSpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;


interface InputSystemProps {
  onAddEntry: (type: EntryType, data: string | MediaFile, additionalData?: { mood?: string }) => void;
  isProcessing: boolean;
}

const InputSystem: React.FC<InputSystemProps> = ({ onAddEntry, isProcessing }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<EntryType>(EntryType.TEXT);
  const [textValue, setTextValue] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

  // Dictation specific state
  const [isDictating, setIsDictating] = useState(false);
  const [dictationError, setDictationError] = useState<string | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null); // SpeechRecognition here refers to the global DOM interface
  const [speechApiSupported, setSpeechApiSupported] = useState(false);
  const [dictationStatus, setDictationStatus] = useState("Ready to dictate.");


  useEffect(() => {
    setSpeechApiSupported(!!BrowserSpeechRecognitionAPI);
  }, []);

  const debouncedSuggestMood = useCallback(
    debounce(async (currentText: string) => {
      if (currentText.trim() && !selectedMood && modalType !== EntryType.IMAGE && modalType !== EntryType.VIDEO) {
        const suggestion = await suggestMoodFromText(currentText);
        if (suggestion && MOOD_EMOJI_LIST.includes(suggestion)) {
           setSelectedMood(suggestion);
        }
      }
    }, 1500),
    [selectedMood, modalType]
  );

  useEffect(() => {
    if (modalType === EntryType.TEXT || modalType === EntryType.VOICE_MEMO) {
      debouncedSuggestMood(textValue);
    }
  }, [textValue, modalType, debouncedSuggestMood]);


  const openModal = (type: EntryType) => {
    setModalType(type);
    setTextValue('');
    setSelectedMood(null);
    setDictationError(null);
    setIsDictating(false);
    if (type === EntryType.VOICE_MEMO) {
        setDictationStatus(speechApiSupported ? "Ready to dictate." : "Speech dictation not supported by your browser.");
    }
    setShowModal(true);
    setIsFabMenuOpen(false);
  };

  const closeModal = () => {
    if (isDictating && speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
    }
    setShowModal(false);
    setTextValue('');
    setSelectedMood(null);
    setIsDictating(false);
    setDictationError(null);
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const entryType = file.type.startsWith('image/') ? EntryType.IMAGE :
                          file.type.startsWith('video/') ? EntryType.VIDEO :
                          EntryType.TEXT;
        
        if (entryType === EntryType.IMAGE || entryType === EntryType.VIDEO) {
            onAddEntry(entryType, { name: file.name, type: file.type, base64 });
        }
      };
      reader.readAsDataURL(file);
    }
    if (event.target) event.target.value = '';
    setIsFabMenuOpen(false);
  };

  const handleTextSubmit = () => {
    if (textValue.trim()) {
      onAddEntry(modalType, textValue, { mood: selectedMood || undefined });
      closeModal();
    }
  };
  
  const handleMoodSelect = (moodEmoji: string) => {
    setSelectedMood(prevMood => prevMood === moodEmoji ? null : moodEmoji);
  };

  // Dictation handlers
  const handleStartDictation = () => {
    if (!speechApiSupported || !BrowserSpeechRecognitionAPI) {
      setDictationError("Speech dictation not supported by your browser.");
      setDictationStatus("Speech dictation not supported.");
      return;
    }
    if (isDictating && speechRecognitionRef.current) { // Effectively "Stop Dictation"
        speechRecognitionRef.current.stop();
        setIsDictating(false);
        setDictationStatus("Dictation stopped. Edit if needed.");
        return;
    }

    speechRecognitionRef.current = new BrowserSpeechRecognitionAPI();
    const recognition = speechRecognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Or make configurable

    let finalTranscript = textValue; // Start with existing text if any

    recognition.onstart = () => {
      setIsDictating(true);
      setDictationError(null);
      setDictationStatus("Listening...");
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTextValue(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsDictating(false);
      let errorMsg = "An unknown dictation error occurred.";
      if (event.error === 'no-speech') errorMsg = "No speech was detected. Try again.";
      else if (event.error === 'audio-capture') errorMsg = "Microphone problem. Ensure it's connected and allowed.";
      else if (event.error === 'not-allowed') errorMsg = "Microphone access denied. Please allow microphone permission in your browser settings.";
      setDictationError(errorMsg);
      setDictationStatus(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsDictating(false);
      // Only update status if no error caused the end
      if (!dictationError && speechRecognitionRef.current) { // Check ref to see if it was an intentional stop
         setDictationStatus("Dictation ended. Edit if needed.");
      }
      if(speechRecognitionRef.current) { // Prevent stopping an already stopped instance
          try { speechRecognitionRef.current.stop(); } catch(e) {/* ignore */}
      }
      speechRecognitionRef.current = null; 
    };
    
    setTextValue(prev => prev ? prev + " " : ""); // Add a space if appending
    recognition.start();
  };


  const fabOptions = [
    { type: EntryType.TEXT, label: 'Text Note', icon: <PencilIcon className="text-white group-hover:text-electric-blue" />, action: () => openModal(EntryType.TEXT) },
    { type: EntryType.VOICE_MEMO, label: 'Voice Memo', icon: <MicFabIcon className="text-white group-hover:text-electric-blue" />, action: () => openModal(EntryType.VOICE_MEMO) },
    { type: 'image_upload', label: 'Upload Image', icon: <ImageIcon className="text-white group-hover:text-electric-blue" />, action: () => fileInputRef.current?.click() },
    { type: 'video_upload', label: 'Upload Video', icon: <VideoIcon className="text-white group-hover:text-electric-blue" />, action: () => fileInputRef.current?.click() }
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-20 safe-area-bottom">
        <div className="relative flex flex-col items-center">
            {isFabMenuOpen && (
                <div className="mb-4 flex flex-col space-y-3">
                    {fabOptions.map((opt) => (
                         <button
                            key={opt.type}
                            onClick={opt.action}
                            className="group flex items-center justify-end p-2 bg-card-bg hover:bg-soft-electric-blue/20 rounded-full shadow-lg transition-all duration-200 ease-out transform"
                            aria-label={opt.label}
                         >
                            <span className="mr-3 text-sm text-gemini-title group-hover:text-electric-blue hidden @sm:inline">{opt.label}</span>
                            {opt.icon}
                         </button>
                    ))}
                </div>
            )}
            <button
                onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
                className={`p-4 bg-electric-blue text-near-black rounded-full shadow-xl hover:opacity-90 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-soft-electric-blue focus:ring-opacity-50 plus-icon-rotate ${isFabMenuOpen ? 'expanded' : ''}`}
                aria-expanded={isFabMenuOpen}
                aria-label={isFabMenuOpen ? "Close menu" : "Add new entry"}
            >
                <PlusIcon className="transition-transform duration-300" />
            </button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
      />

      {showModal && (modalType === EntryType.TEXT || modalType === EntryType.VOICE_MEMO) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30 p-4" onClick={closeModal}>
          <div className="bg-card-bg p-6 rounded-xl shadow-xl w-full max-w-lg border border-border-color" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4 text-gemini-title">
              New {modalType === EntryType.TEXT ? 'Text Note' : 'Voice Memo'}
            </h2>
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={modalType === EntryType.TEXT ? "What's on your mind?" : "Your dictated thoughts will appear here..."}
              className="w-full h-40 p-3.5 bg-[rgba(255,255,255,0.08)] text-gemini-title placeholder:text-light-gray placeholder:opacity-75 rounded-lg border border-[rgba(255,255,255,0.1)] focus:ring-2 focus:ring-electric-blue focus:outline-none resize-none text-base leading-relaxed caret-electric-blue"
              aria-label={modalType === EntryType.TEXT ? "Text note content" : "Voice memo content"}
              autoFocus={modalType === EntryType.TEXT} // Autofocus for text, but not for voice to avoid immediate keyboard pop-up
            />

            {modalType === EntryType.VOICE_MEMO && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleStartDictation}
                  disabled={!speechApiSupported || (isDictating && !speechRecognitionRef.current)} // Disable if already stopped but not reset
                  className={`w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors
                              ${isDictating ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-electric-blue hover:opacity-80 text-near-black'}
                              ${!speechApiSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <MicFabIcon className="mr-2 h-5 w-5" isRecording={isDictating} />
                  {isDictating ? 'Stop Dictation' : 'Start Dictation'}
                </button>
                <p className={`text-xs text-center ${dictationError ? 'text-red-400' : 'text-light-gray'}`}>
                  {dictationError || dictationStatus}
                </p>
              </div>
            )}

            <div className="mt-4">
              <p className="text-sm text-light-gray mb-2">Add a mood (optional):</p>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((moodOpt) => (
                  <button
                    key={moodOpt.emoji}
                    onClick={() => handleMoodSelect(moodOpt.emoji)}
                    className={`p-2 rounded-full text-2xl transition-all duration-150 ease-in-out
                                ${selectedMood === moodOpt.emoji ? 'bg-electric-blue/30 scale-110 ring-2 ring-electric-blue' : 'hover:bg-white/10'}`}
                    aria-label={moodOpt.label}
                    title={moodOpt.label}
                  >
                    {moodOpt.emoji}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-light-gray hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTextSubmit}
                disabled={!textValue.trim() || isProcessing}
                className="px-5 py-2.5 text-sm font-medium bg-electric-blue text-near-black rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {isProcessing ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InputSystem;
