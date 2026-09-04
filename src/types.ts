export interface AudioMetrics {
  duration: number;
  sampleRate: number;
  samples: number;
  channels: number;
  amplitude: number;
  dominantFrequency: number;
}

export interface AIResponse {
  transcription: string;
  intent: string;
  keywords: string[];
  summary: string;
  response: string;
}

export interface Experiment {
  id: string;
  name: string;
  duration: number;
  words: number;
  wer: string;
  processingTime: number;
  dominantFreq: number;
}
