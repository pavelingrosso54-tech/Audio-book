
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { decode, decodeAudioData, audioBufferToWav } from "./audioUtils";

const API_KEY = process.env.API_KEY || "";

/**
 * Uses gemini-3-flash-preview to extract clean text from a file (PDF/Text).
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const reader = new FileReader();
  const base64Promise = new Promise<string>((resolve) => {
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  });

  const base64Data = await base64Promise;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.type || 'application/pdf',
            data: base64Data,
          },
        },
        {
          text: "Пожалуйста, извлеки весь значимый текст из этого документа для создания аудиокниги. Удали заголовки, подвалы страниц, номера страниц и лишние метаданные. Оставь только основной текст (повествование). Сохраняй оригинальный язык текста (например, русский).",
        }
      ]
    },
  });

  return response.text || "";
}

/**
 * Synthesizes a short preview of a voice.
 */
export async function previewVoice(voice: VoiceName): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Привет! Я голос ${voice}. Как я звучу?` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("TTS failed");
  
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
  return URL.createObjectURL(audioBufferToWav(audioBuffer));
}

/**
 * Uses gemini-2.5-flash-preview-tts to synthesize speech.
 * Supports single voice or Duo Mode (multi-speaker).
 */
export async function synthesizeSpeech(
  text: string, 
  voice: VoiceName, 
  isDuoMode: boolean = false, 
  secondaryVoice: VoiceName = VoiceName.Kore
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = isDuoMode 
    ? `Озвучь следующий текст как диалог. Используй Narrator для повествования и Character для диалогов: ${text.substring(0, 4000)}`
    : `Прочитай следующий текст естественно и выразительно: ${text.substring(0, 5000)}`;

  const speechConfig = isDuoMode ? {
    multiSpeakerVoiceConfig: {
      speakerVoiceConfigs: [
        {
          speaker: 'Narrator',
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } }
        },
        {
          speaker: 'Character',
          voiceConfig: { prebuiltVoiceConfig: { voiceName: secondaryVoice } }
        }
      ]
    }
  } : {
    voiceConfig: {
      prebuiltVoiceConfig: { voiceName: voice },
    },
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig,
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Не удалось получить аудиоданные");
  }

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
  return URL.createObjectURL(audioBufferToWav(audioBuffer));
}
