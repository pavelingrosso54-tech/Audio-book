
export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  description: string;
}

export interface AudiobookJob {
  id: string;
  text: string;
  voice: VoiceName;
  secondaryVoice?: VoiceName;
  isDuoMode: boolean;
  status: 'idle' | 'extracting' | 'synthesizing' | 'completed' | 'error';
  audioUrl?: string;
  error?: string;
}

export const VOICES: VoiceOption[] = [
  { id: VoiceName.Kore, name: 'Kore', description: 'Яркий и энергичный' },
  { id: VoiceName.Puck, name: 'Puck', description: 'Теплый и дружелюбный' },
  { id: VoiceName.Charon, name: 'Charon', description: 'Глубокий и авторитетный' },
  { id: VoiceName.Fenrir, name: 'Fenrir', description: 'Таинственный и спокойный' },
  { id: VoiceName.Zephyr, name: 'Zephyr', description: 'Гладкий и четкий' },
];
