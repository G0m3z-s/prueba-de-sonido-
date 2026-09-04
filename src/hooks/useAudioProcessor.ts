import { useState, useRef, useCallback } from 'react';
import { AudioMetrics, AIResponse } from '@/types';

export function useAudioProcessor() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics | null>(null);
  const [numericSamples, setNumericSamples] = useState<number[]>([]);
  const [aiResult, setAiResult] = useState<AIResponse | null>(null);
  const [processingTime, setProcessingTime] = useState<number>(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const startTimeRef = useRef<number>(0);

  // Canvas Refs
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const spectrogramXRef = useRef(0);

  const startRecording = async () => {
    try {
      setError(null);
      setAiResult(null);
      setAudioMetrics(null);
      setNumericSamples([]);
      spectrogramXRef.current = 0;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;
      
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048; // good for both waveform and spectrum
      source.connect(analyser);
      analyserRef.current = analyser;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob, ctx.sampleRate);
      };
      
      startTimeRef.current = Date.now();
      mediaRecorder.start(100); // collect chunks every 100ms
      setIsRecording(true);
      
      drawVisualizations();
      
    } catch (err: any) {
      console.error(err);
      setError(err.name === 'NotAllowedError' 
        ? 'No se otorgó permiso para usar el micrófono.' 
        : 'Error al acceder al micrófono. Verifique su dispositivo.');
    }
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Calculate basic duration metrics
      const durationMs = Date.now() - startTimeRef.current;
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const totalSamples = Math.floor((durationMs / 1000) * sampleRate);
      
      setAudioMetrics({
        duration: durationMs / 1000,
        sampleRate,
        samples: totalSamples,
        channels: 1, // getUserMedia audio is typically mono unless specified
        amplitude: 0, // calculated during draw
        dominantFrequency: 0 // calculated during draw
      });
      
      // Extract a few real samples for the UI from the current buffer
      if (analyserRef.current) {
        const dataArray = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(dataArray);
        const sampleSnapshot = Array.from(dataArray).slice(0, 50); // Get 50 samples
        setNumericSamples(sampleSnapshot);
      }
    }
  }, [isRecording]);

  const processAudio = async (blob: Blob, sampleRate: number) => {
    const processStart = Date.now();
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const response = await fetch('/api/analyze-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64data, mimeType: blob.type })
        });
        
        if (!response.ok) {
          const errRes = await response.json();
          throw new Error(errRes.error || 'Error procesando audio con la IA');
        }
        
        const data: AIResponse = await response.json();
        setAiResult(data);
      };
    } catch (err: any) {
      setError(err.message || 'Error de conexión con el servidor IA.');
    } finally {
      setIsProcessing(false);
      setProcessingTime((Date.now() - processStart) / 1000);
    }
  };

  const drawVisualizations = () => {
    if (!analyserRef.current || !isRecording) return;
    
    const analyser = analyserRef.current;
    
    // Waveform
    if (waveformCanvasRef.current) {
      const canvas = waveformCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#003366';
        ctx.beginPath();
        
        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;
        let maxAmplitude = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = v * (canvas.height / 2);
          
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          
          x += sliceWidth;
          maxAmplitude = Math.max(maxAmplitude, Math.abs(dataArray[i] - 128));
        }
        
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }
    }
    
    // Spectrum
    if (spectrumCanvasRef.current) {
      const canvas = spectrumCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        let maxEnergy = 0;
        let maxFreqIndex = 0;
        
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          
          if (dataArray[i] > maxEnergy) {
            maxEnergy = dataArray[i];
            maxFreqIndex = i;
          }
          
          const r = barHeight + (25 * (i / bufferLength));
          const g = 250 * (i / bufferLength);
          const b = 50;
          
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          
          x += barWidth + 1;
        }
      }
    }

    // Spectrogram (Waterfall)
    if (spectrogramCanvasRef.current) {
      const canvas = spectrogramCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // Move current image left
        if (spectrogramXRef.current > canvas.width) {
          const imgData = ctx.getImageData(1, 0, canvas.width - 1, canvas.height);
          ctx.putImageData(imgData, 0, 0);
          spectrogramXRef.current = canvas.width - 1;
        }
        
        // Draw new column
        for (let i = 0; i < bufferLength; i++) {
          const value = dataArray[i];
          ctx.fillStyle = `hsl(${240 - value}, 100%, ${value / 255 * 50}%)`;
          ctx.fillRect(spectrogramXRef.current, canvas.height - (i * canvas.height / bufferLength), 1, canvas.height / bufferLength);
        }
        spectrogramXRef.current++;
      }
    }

    animationFrameRef.current = requestAnimationFrame(drawVisualizations);
  };

  const playTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CO'; // Colombian Spanish or default ES
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopTTS = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return {
    isRecording,
    isProcessing,
    isSpeaking,
    error,
    startRecording,
    stopRecording,
    waveformCanvasRef,
    spectrumCanvasRef,
    spectrogramCanvasRef,
    audioMetrics,
    numericSamples,
    aiResult,
    processingTime,
    playTTS,
    stopTTS
  };
}
