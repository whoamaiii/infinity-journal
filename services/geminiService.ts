
import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { GEMINI_MODEL_NAME, SYSTEM_PROMPT_IMAGE_ANALYSIS, SYSTEM_PROMPT_VIDEO_ANALYSIS, SYSTEM_PROMPT_SUMMARY, DIARY_SYSTEM_INSTRUCTION } from '../constants';
import { MediaFile } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY environment variable is not set. Gemini API calls will fail.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY! });

// Consistent list of moods for suggestions and UI
export const MOOD_EMOJI_LIST = ['😊', '😢', '🤔', '🎉', '😠', '😌', '😮', '🤩'];


const generateContentInternal = async (prompt: string, systemInstruction?: string, imagePart?: Part) => {
  if (!API_KEY) {
    throw new Error("API Key not configured. Cannot call Gemini API.");
  }
  try {
    const contents = imagePart ? [{ role: "user", parts: [imagePart, { text: prompt }] }] : [{ role: "user", parts: [{ text: prompt }] }];
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: contents,
      ...(systemInstruction && { config: { systemInstruction } }),
    });
    return response.text;
  } catch (error) {
    console.error('Error generating content:', error);
    if (error instanceof Error) {
        // More specific error handling could be added here based on error types from SDK
        if (error.message.includes("API key not valid")) {
             throw new Error("Invalid API Key. Please check your configuration.");
        }
    }
    throw new Error('Failed to generate content from Gemini API.');
  }
};

export const analyzeImage = async (mediaFile: MediaFile, isVideoThumbnail: boolean = false): Promise<string> => {
  const imagePart: Part = {
    inlineData: {
      mimeType: mediaFile.type,
      data: mediaFile.base64.split(',')[1], // Remove the "data:mime/type;base64," prefix
    },
  };
  const systemInstruction = isVideoThumbnail ? SYSTEM_PROMPT_VIDEO_ANALYSIS : SYSTEM_PROMPT_IMAGE_ANALYSIS;
  const prompt = isVideoThumbnail ? "Describe this video thumbnail." : "Describe this image.";
  return generateContentInternal(prompt, systemInstruction, imagePart);
};

export const generateJournalSummary = async (entriesText: string): Promise<string> => {
  return generateContentInternal(entriesText, SYSTEM_PROMPT_SUMMARY);
};

export const formatTextForDiary = async (text: string): Promise<string> => {
    return generateContentInternal(text, DIARY_SYSTEM_INSTRUCTION);
};

export const transcribeAudio = async (audioFile: MediaFile): Promise<string> => {
  console.warn("Actual audio transcription with gemini-2.5-flash-preview-04-17 via generateContent is not directly supported in this manner. Simulating with text input for 'Voice Memo'.");
  return Promise.resolve("Simulated transcription for: " + audioFile.name);
};

export const suggestMoodFromText = async (text: string): Promise<string | null> => {
  if (!text.trim() || text.trim().split(/\s+/).length < 3) { // Avoid API call for very short text
    return null;
  }
  const systemInstruction = `Analyze the following journal entry text and suggest the single most dominant mood. Choose *only* from this list of emojis: ${MOOD_EMOJI_LIST.join(', ')}. Return *only* the single emoji character that best represents the mood. If no specific mood is strongly evident or the text is too ambiguous, return the string "neutral".`;
  try {
    const suggestedEmoji = await generateContentInternal(text, systemInstruction);
    if (suggestedEmoji && MOOD_EMOJI_LIST.includes(suggestedEmoji.trim())) {
      return suggestedEmoji.trim();
    }
    return null; // If response is "neutral" or not a valid emoji from our list
  } catch (error) {
    console.error("Error suggesting mood:", error);
    return null;
  }
};
