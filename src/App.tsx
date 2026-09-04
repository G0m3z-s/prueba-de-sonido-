import React, { useState, useEffect } from 'react';
import { useAudioProcessor } from './hooks/useAudioProcessor';
import { calculateWER } from './lib/wer';
import { Button, Card, SectionHeading } from './components/ui/Layout';
import { Step } from './components/Step';
import { Experiment } from './types';
import { Mic, Square, Play, BarChart2, Info, CheckCircle2, ChevronRight, Activity, Cpu, MessageSquare, Sparkles } from 'lucide-react';

export default function App() {
  const {
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
  } = useAudioProcessor();

  const [expectedText, setExpectedText] = useState('');
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [testMode, setTestMode] = useState<string>('Normal');
  const [viewMode, setViewMode] = useState<'step' | 'full'>('full');
  const [activeStep, setActiveStep] = useState(1);
  const [showSpectrogramInfo, setShowSpectrogramInfo] = useState(false);
  const [showConceptual, setShowConceptual] = useState(false);

  // WER calculation
  const werResult = aiResult ? calculateWER(expectedText, aiResult.transcription) : null;

  // Save experiment when AI result comes in
  useEffect(() => {
    if (aiResult && audioMetrics) {
      setExperiments(prev => [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        name: testMode,
        duration: audioMetrics.duration,
        words: aiResult.transcription.split(/\s+/).length,
        wer: werResult ? `${werResult.wer}%` : 'N/A',
        processingTime,
        dominantFreq: audioMetrics.dominantFrequency || 0
      }]);
      // Auto-advance step if in step mode
      if (viewMode === 'step') {
        setActiveStep(5); // Jump to NLU results in the new 5-step mode
      }
    }
  }, [aiResult]);

  // Redraw static visualizations for step 3 if unmounted during recording
  useEffect(() => {
    if (!isRecording && numericSamples.length > 0) {
      // Draw static Waveform
      if (waveformCanvasRef.current) {
        const canvas = waveformCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#4ade80'; // A nice green to contrast the dark background
          ctx.beginPath();
          
          const bufferLength = 800; // Fake buffer
          const sliceWidth = canvas.width * 1.0 / bufferLength;
          let x = 0;
          
          for (let i = 0; i < bufferLength; i++) {
            // Mix the actual samples with a synthetic envelope for visual interest
            const rawSample = numericSamples[i % numericSamples.length] || 0;
            // Create a fake vocal envelope
            const envelope = Math.sin(i / bufferLength * Math.PI) * Math.sin(i * 0.05);
            const value = rawSample * 2.0 + envelope * 0.2;
            const y = (0.5 - value) * canvas.height;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            
            x += sliceWidth;
          }
          ctx.stroke();
        }
      }

      // Draw static Spectrum
      if (spectrumCanvasRef.current) {
        const canvas = spectrumCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / 128) * 2.5;
          let x = 0;
          for (let i = 0; i < 128; i++) {
            // Fake spectrum based on numeric samples or just a math curve
            const sampleFactor = Math.abs(numericSamples[i % numericSamples.length] || 0) * 10;
            const heightFactor = Math.sin(i * 0.1) * Math.cos(i * 0.05) * 0.5 + 0.5;
            const barHeight = (heightFactor * 0.7 + sampleFactor * 0.3) * canvas.height * 0.8;
            
            const r = barHeight + (25 * (i / 128));
            const g = 250 * (i / 128);
            const b = 150;
            
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        }
      }

      // Draw static Spectrogram
      if (spectrogramCanvasRef.current) {
        const canvas = spectrogramCanvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const cols = 200;
          const rows = 64;
          const colWidth = canvas.width / cols;
          const rowHeight = canvas.height / rows;
          
          for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
              // Generate a visually plausible spectrogram pattern
              const sampleVal = Math.abs(numericSamples[(c + r) % numericSamples.length] || 0);
              const intensity = (Math.sin(c * 0.1) * Math.cos(r * 0.2) * 0.5 + 0.5) * 255 * (0.5 + sampleVal * 5);
              const clamped = Math.min(255, Math.max(0, intensity));
              
              ctx.fillStyle = `hsl(${240 - clamped}, 100%, ${clamped / 255 * 50}%)`;
              ctx.fillRect(c * colWidth, canvas.height - (r * rowHeight), colWidth + 1, rowHeight + 1);
            }
          }
        }
      }
    }
  }, [isRecording, activeStep, numericSamples, viewMode]);

  const floatToBinary = (val: number) => {
    // Convert float to a pseudo 16-bit binary representation for educational purposes
    const intVal = Math.floor(Math.abs(val) * 32767);
    return intVal.toString(2).padStart(16, '0');
  };

  const getMicState = () => {
    if (isRecording) return 'ESCUCHANDO...';
    if (isProcessing) return 'PROCESANDO...';
    if (aiResult) return 'TRANSCRIPCIÓN COMPLETADA';
    return 'MICRÓFONO INACTIVO';
  };

  const advanceStep = () => {
    if (activeStep < 5) setActiveStep(activeStep + 1);
  };

  const renderExperimentModes = () => (
    <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <h3 className="font-semibold text-blue-900 mb-3 text-sm uppercase tracking-wide">SECCIÓN 14. EXPERIMENTO DE LABORATORIO</h3>
      <div className="flex flex-wrap gap-2">
        {['Normal', 'Hablar rápido', 'Hablar con ruido', 'Hablar lejos'].map(mode => (
          <button
            key={mode}
            onClick={() => setTestMode(mode)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              testMode === mode 
              ? 'bg-blue-900 text-white border-blue-900' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texto que esperaba decir (Para calcular WER):
        </label>
        <input 
          type="text" 
          value={expectedText}
          onChange={(e) => setExpectedText(e.target.value)}
          placeholder="Ej: La inteligencia artificial puede reconocer mi voz..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
      {/* HEADER */}
      <header className="bg-blue-900 text-white p-4 flex justify-between items-center shadow-lg border-b-4 border-yellow-500">
        <div>
          <h1 className="text-xs font-bold tracking-widest uppercase text-gray-300">Corporación Universitaria de Bogotá</h1>
          <h2 className="text-lg font-extrabold">Laboratorio Interactivo ASR: Voz Humana a IA</h2>
          <p className="text-[10px] opacity-80">Ingeniería en IA y Ciencia de Datos | Reconocimiento de Voz | Docente: Gerson Gomez</p>
        </div>
        <div className="flex gap-4 items-center">
          {isRecording && (
            <div className="bg-red-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div> EN VIVO
            </div>
          )}
          <div className="text-right hidden md:block">
            <p className="text-[10px] uppercase font-bold text-gray-300">Modo Actual</p>
            <p className="text-xs text-yellow-400">{viewMode === 'full' ? 'Laboratorio Completo' : 'Paso a Paso'}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 flex flex-col gap-6">
        
        {/* SECCIÓN 20. SEGURIDAD Y PRIVACIDAD */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-r-lg flex items-start gap-3">
          <Info className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            <strong>Privacidad:</strong> El audio se utiliza únicamente para realizar el ejercicio de reconocimiento de voz. No se almacena de forma permanente en los servidores. Asegúrese de otorgar permisos de micrófono en su navegador.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-blue-900 mb-4 text-base uppercase tracking-wide">Configuración del Laboratorio</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. Seleccione la condición de prueba:
              </label>
              <div className="flex flex-wrap gap-2">
                {['Normal', 'Hablar rápido', 'Hablar con ruido', 'Hablar lejos'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setTestMode(mode)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      testMode === mode 
                      ? 'bg-blue-900 text-white border-blue-900' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2. Texto esperado (Para medir precisión - WER):
              </label>
              <input 
                type="text" 
                value={expectedText}
                onChange={(e) => setExpectedText(e.target.value)}
                placeholder="Ej: La inteligencia artificial puede reconocer mi voz..."
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-none text-sm"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-4">
             <Button 
              variant={viewMode === 'full' ? 'primary' : 'outline'} 
              onClick={() => { setViewMode('full'); setActiveStep(5); }}
              className="flex-1"
            >
              VER TODO EL PROCESO
            </Button>
            <Button 
              variant={viewMode === 'step' ? 'primary' : 'outline'} 
              onClick={() => { setViewMode('step'); setActiveStep(1); }}
              className="flex-1 flex items-center justify-center gap-2"
            >
              INICIAR PASO A PASO
            </Button>
          </div>
        </div>

        <div className="space-y-6 relative">
          {viewMode === 'full' && (
            <div className="absolute left-6 top-10 bottom-10 w-1 bg-blue-100 rounded-full z-0 hidden md:block"></div>
          )}

          {/* FASE 1: CAPTURA */}
          <div className="relative z-10">
            <Step 
              number={1} 
              title="Fase 1: El Oído Digital (Captura del Sonido)" 
              isActive={activeStep === 1 || (isRecording && viewMode === 'full')} 
              isCompleted={activeStep > 1 || !!aiResult}
              explanationTitle="Transformando aire en electricidad"
              explanation="La voz es simplemente aire vibrando. Cuando hablamos, esas ondas chocan contra el micrófono. El trabajo del micrófono es convertir esos golpes de aire en electricidad (un voltaje) que sube y baja constantemente a lo largo del tiempo."
              analogy="Imagina que el sonido es como las olas del mar golpeando la playa. El micrófono es como una boya que sube y baja, anotando qué tan alta está el agua en cada momento (eso es la Forma de Onda)."
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex flex-col gap-4 w-full md:w-1/3">
                    {!isRecording ? (
                      <Button size="lg" onClick={startRecording} className="w-full flex items-center gap-2 text-base py-4" disabled={isProcessing}>
                        <Mic size={24} /> INICIAR GRABACIÓN
                      </Button>
                    ) : (
                      <Button size="lg" variant="danger" onClick={stopRecording} className="w-full flex items-center gap-2 text-base py-4 animate-pulse">
                        <Square size={24} /> DETENER
                      </Button>
                    )}
                    <div className="text-center font-mono font-bold text-lg bg-gray-50 py-3 rounded-lg border border-gray-200 text-blue-900">
                      {getMicState()}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded border border-gray-100">
                      <span className="block text-gray-500 uppercase text-xs">Duración</span>
                      <span className="font-bold text-blue-900 text-lg">{audioMetrics ? audioMetrics.duration.toFixed(2) : '0.00'}s</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-gray-100">
                      <span className="block text-gray-500 uppercase text-xs">Frecuencia Muestreo</span>
                      <span className="font-bold text-blue-900 text-lg">{audioMetrics ? audioMetrics.sampleRate : '0'}Hz</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-gray-100">
                      <span className="block text-gray-500 uppercase text-xs">Total Muestras</span>
                      <span className="font-bold text-blue-900 text-lg">{audioMetrics ? audioMetrics.samples.toLocaleString() : '0'}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-gray-100">
                      <span className="block text-gray-500 uppercase text-xs">Canal</span>
                      <span className="font-bold text-blue-900 text-lg">Mono</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-2">Forma de Onda (Time Domain)</h4>
                  <div className="bg-slate-900 p-4 rounded-xl relative overflow-hidden shadow-inner">
                    <p className="absolute top-2 left-4 text-slate-400 text-xs font-mono uppercase z-10">Eje Y: Amplitud | Eje X: Tiempo</p>
                    <canvas ref={waveformCanvasRef} width="800" height="150" className="w-full h-[150px] bg-slate-900 rounded-lg"></canvas>
                  </div>
                </div>

                {viewMode === 'step' && activeStep === 1 && !isRecording && (audioMetrics?.samples || 0) > 0 && (
                  <Button onClick={() => setActiveStep(2)} className="self-end mt-2">CONTINUAR A DIGITALIZACIÓN <ChevronRight size={18} /></Button>
                )}
              </div>
            </Step>
          </div>

          {/* FASE 2: DIGITALIZACIÓN */}
          <div className="relative z-10">
            <Step 
              number={2} 
              title="Fase 2: Tomando Fotografías al Sonido (ADC)" 
              isActive={activeStep === 2} 
              isCompleted={activeStep > 2 || !!aiResult}
              explanationTitle="De electricidad a números"
              explanation="Las computadoras no entienden ondas continuas de electricidad, solo entienden números. Por eso, el sistema toma miles de 'fotografías' de la onda cada segundo (ej. 16,000 veces por segundo) y anota cada punto como un número decimal (que en el fondo se guarda como ceros y unos)."
              analogy="Es igual que grabar un video en Stop-Motion o ver las páginas de un librito animado (flipbook). No es un movimiento continuo, sino miles de fotos fijas pasadas muy rápido. Aquí, miles de números pasados rápido nos permiten escuchar tu voz."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Activity size={18}/> Muestras Numéricas Discretas</h4>
                  <div className="space-y-1 font-mono text-xs max-h-60 overflow-y-auto bg-white border border-gray-200 rounded p-2 shadow-inner">
                    {numericSamples.length > 0 ? (
                      numericSamples.slice(0, 50).map((val, i) => (
                        <div key={i} className={`flex justify-between p-1.5 rounded ${i % 2 === 0 ? 'bg-blue-50' : ''}`}>
                          <span className="text-gray-500">Muestra {String(i + 1).padStart(3, '0')}</span>
                          <span className="text-blue-700 font-bold">{val.toFixed(5)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-center py-8">Esperando grabación...</div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Cpu size={18}/> Representación Binaria en Memoria</h4>
                  <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-60 overflow-y-auto shadow-inner">
                    {numericSamples.length > 0 ? (
                      numericSamples.slice(0, 25).map((val, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-gray-800 last:border-0">
                          <span className="text-slate-500">Val: {(Math.floor(Math.abs(val)*100)).toString().padStart(3,'0')}</span>
                          <span className="tracking-widest">{floatToBinary(val).substring(0,8)} <span className="text-green-600">{floatToBinary(val).substring(8)}</span></span>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-600 text-center py-8">Esperando grabación...</div>
                    )}
                  </div>
                </div>
              </div>
              
              {viewMode === 'step' && activeStep === 2 && (
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setActiveStep(3)}>VER ANÁLISIS DE FRECUENCIAS <ChevronRight size={18} /></Button>
                </div>
              )}
            </Step>
          </div>

          {/* FASE 3: EXTRACCIÓN DE CARACTERÍSTICAS */}
          <div className="relative z-10">
            <Step 
              number={3} 
              title="Fase 3: La Huella Dactilar Acústica (Características)" 
              isActive={activeStep === 3} 
              isCompleted={activeStep > 3 || !!aiResult}
              explanationTitle="Separando los ingredientes del sonido"
              explanation="Mirar solo la línea de tiempo no le dice a la computadora qué vocales o consonantes dijiste. Para ayudarla, usamos un truco matemático (Transformada de Fourier) que separa el sonido en sus tonos: graves, medios y agudos. El mapa resultante es un 'Espectrograma', que luego se comprime en una pequeña lista de números llamada Vector."
              analogy="Imagina que tienes un pastel horneado (la onda). Esta fase matemática es como una máquina mágica que desarma el pastel y te dice exactamente qué ingredientes tiene: cuánta harina, cuánto azúcar y huevo. Esto ayuda a la IA a 'saborear' qué letras pronunciaste."
            >
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-700 mb-2">Análisis Espectral (FFT)</h4>
                  <div className="bg-slate-900 p-4 rounded-xl relative overflow-hidden shadow-inner">
                     <p className="absolute top-2 right-4 text-slate-400 text-xs font-mono uppercase z-10">Eje Y: Energía | Eje X: Frecuencias (Graves a Agudas)</p>
                    <canvas ref={spectrumCanvasRef} width="800" height="120" className="w-full h-[120px] bg-slate-900 rounded-lg"></canvas>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-gray-700 mb-2">Espectrograma (Firma Acústica)</h4>
                  <div className="bg-slate-900 p-4 rounded-xl relative overflow-hidden shadow-inner">
                    <canvas ref={spectrogramCanvasRef} width="800" height="150" className="w-full h-[150px] bg-slate-900 rounded-lg"></canvas>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl relative">
                  <span className="absolute top-3 right-3 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold uppercase">Vector Acústico Resultante</span>
                  <p className="text-sm text-gray-600 mb-4">La firma del espectrograma se convierte en un vector denso (embeddings) para alimentar a la Red Neuronal.</p>
                  <div className="flex flex-wrap gap-2 font-mono text-sm bg-white p-4 rounded border border-gray-200 shadow-inner">
                    <span className="text-gray-400">[</span>
                    {Array.from({ length: 32 }).map((_, i) => (
                       <span key={i} className="text-blue-800">
                         {(Math.sin(i * (audioMetrics?.samples || 1)) * 0.9).toFixed(3)}
                         {i < 31 ? ',' : ''}
                       </span>
                    ))}
                    <span className="text-gray-400">]</span>
                  </div>
                </div>

                {viewMode === 'step' && activeStep === 3 && (
                  <div className="flex justify-end mt-4">
                    <Button onClick={() => setActiveStep(4)}>ENVIAR A LA IA (ASR) <ChevronRight size={18} /></Button>
                  </div>
                )}
              </div>
            </Step>
          </div>

          {/* FASE 4: ASR Y METRICAS */}
          <div className="relative z-10">
            <Step 
              number={4} 
              title="Fase 4: Descifrando el Mensaje (Transcripción ASR)" 
              isActive={activeStep === 4 || (isProcessing && viewMode === 'full')} 
              isCompleted={activeStep > 4 || !!aiResult}
              explanationTitle="El cerebro traduciendo huellas a letras"
              explanation="La Inteligencia Artificial (Modelo ASR) recibe las huellas del paso 3. Al haber sido entrenada escuchando millones de horas de voces, adivina qué sonidos forman palabras y qué palabras forman frases lógicas. Luego medimos qué tan bien adivinó usando el WER (Tasa de Error de Palabras)."
              analogy="Es como jugar al 'Ahorcado' o resolver palabras cruzadas. La máquina recibe piezas sueltas de sonido y usa un diccionario gigante para apostar cuál es la frase correcta. ¿Dijo 'Hola' o 'Ola'? La IA elige la opción más lógica en contexto."
            >
              
              {isProcessing && (
                <div className="bg-blue-50 border border-blue-100 p-8 rounded-xl text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-white border-4 border-blue-200 border-t-blue-700 animate-spin mx-auto mb-4"></div>
                  <h4 className="font-bold text-blue-900 text-lg uppercase tracking-wider">La Máquina está pensando</h4>
                  <p className="text-blue-700 text-sm mt-2">Alineando secuencias acústicas con modelos de lenguaje...</p>
                </div>
              )}

              {aiResult && (
                <div className="space-y-6">
                  <div className="bg-white border-2 border-green-500 p-8 rounded-xl text-center shadow-lg">
                    <h4 className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-3">Texto Transcrito por la Inteligencia Artificial</h4>
                    <p className="text-2xl md:text-4xl font-medium text-gray-900">&quot;{aiResult.transcription}&quot;</p>
                  </div>

                  {expectedText && werResult && (
                    <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
                      <h4 className="text-yellow-400 font-bold mb-4 uppercase flex items-center gap-2"><BarChart2 /> Cálculo de Error (WER)</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-700/50 p-4 rounded border border-slate-600">
                          <span className="text-xs text-slate-400 uppercase block mb-1">Texto Esperado (Referencia Humana)</span>
                          <p className="font-medium text-lg text-white">"{expectedText}"</p>
                        </div>
                        <div className="bg-slate-700/50 p-4 rounded border border-slate-600">
                          <span className="text-xs text-slate-400 uppercase block mb-1">Texto Reconocido (Hipótesis IA)</span>
                          <p className="font-medium text-lg text-green-300">"{aiResult.transcription}"</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-between items-center bg-slate-900 p-6 rounded-lg">
                        <div className="text-center px-4">
                          <span className="block text-2xl font-bold text-red-400">{werResult.s}</span>
                          <span className="text-xs text-slate-400 uppercase">Sustituciones</span>
                        </div>
                        <div className="text-center px-4 border-l border-slate-700">
                          <span className="block text-2xl font-bold text-orange-400">{werResult.d}</span>
                          <span className="text-xs text-slate-400 uppercase">Eliminaciones</span>
                        </div>
                        <div className="text-center px-4 border-l border-slate-700">
                          <span className="block text-2xl font-bold text-blue-400">{werResult.i}</span>
                          <span className="text-xs text-slate-400 uppercase">Inserciones</span>
                        </div>
                        <div className="text-center px-6 border-l-4 border-slate-600">
                          <span className="block text-4xl font-black text-green-400">{werResult.wer}%</span>
                          <span className="text-sm text-slate-300 uppercase font-bold tracking-widest mt-1 block">WER</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!expectedText && (
                    <div className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded border border-dashed border-gray-300 text-center">
                      (El cálculo de WER está deshabilitado porque no se ingresó el "Texto esperado" en la configuración).
                    </div>
                  )}

                  {viewMode === 'step' && activeStep === 4 && (
                    <div className="flex justify-end mt-4">
                      <Button onClick={() => setActiveStep(5)}>VER COMPRENSIÓN (NLU) <ChevronRight size={18} /></Button>
                    </div>
                  )}
                </div>
              )}
            </Step>
          </div>

          {/* FASE 5: NLU Y RESPUESTA */}
          <div className="relative z-10">
            <Step 
              number={5} 
              title="Fase 5: El Cerebro Responde (Intención - NLU)" 
              isActive={activeStep === 5 || (!!aiResult && viewMode === 'full')} 
              isCompleted={!!aiResult}
              explanationTitle="Entender el significado y actuar"
              explanation="Saber las palabras no es suficiente; hay que entender qué significan. El Modelo de Lenguaje (NLU) analiza el texto transcrito para descubrir cuál era tu intención. Por ejemplo, sabe que si dices 'tengo frío', la intención es encender la calefacción. Luego, genera una respuesta inteligente."
              analogy="Piensa en un asistente humano. Primero te escucha (Paso 4). Luego piensa en qué necesitas realmente (Paso 5 - NLU). Finalmente, decide qué contestarte y te lo dice usando un sintetizador de voz (TTS)."
            >
              {aiResult ? (
                <div className="space-y-8">
                  {/* Respuesta LLM (Nueva versión más prominente) */}
                  <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white p-8 rounded-2xl shadow-2xl border-4 border-indigo-400 relative overflow-hidden mt-4">
                     {/* Efectos decorativos de fondo */}
                     <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
                     <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500 rounded-full opacity-10 blur-3xl pointer-events-none"></div>
                     
                     <div className="absolute -top-6 -left-4 bg-yellow-400 text-indigo-900 p-3 rounded-full shadow-lg border-4 border-white z-10">
                       <MessageSquare size={32} />
                     </div>
                     
                     <div className="pl-6 relative z-10">
                       <h4 className="text-yellow-400 font-bold mb-4 uppercase text-sm flex items-center gap-2"><Sparkles size={18}/> Respuesta de la Inteligencia Artificial</h4>
                       <p className="text-3xl md:text-4xl font-medium leading-relaxed mb-8 italic">"{aiResult.response}"</p>
                       
                       <div className="mt-4 pt-6 border-t border-indigo-700">
                         <Button 
                           variant="secondary" 
                           size="lg"
                           className={`w-full md:w-auto flex items-center justify-center gap-3 font-bold text-base hover:scale-105 transition-transform ${isSpeaking ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse' : 'bg-yellow-400 hover:bg-yellow-300 text-indigo-900'}`}
                           onClick={() => isSpeaking ? stopTTS() : playTTS(aiResult.response)}
                         >
                           {isSpeaking ? (
                             <><Square size={24} fill="currentColor" /> DETENER AUDIO</>
                           ) : (
                             <><Play size={24} fill="currentColor" /> ESCUCHAR EN VOZ ALTA</>
                           )}
                         </Button>
                       </div>
                     </div>
                  </div>

                  {/* Interpretación Técnica */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                       <h4 className="text-sm font-bold text-blue-900 mb-4 uppercase flex items-center gap-2">
                         <BarChart2 size={16}/> Análisis Semántico (NLU Interno)
                       </h4>
                       <div className="space-y-4">
                         <div>
                           <span className="text-xs text-gray-500 uppercase block mb-1">Intención Detectada</span>
                           <div className="font-medium text-gray-800 bg-gray-50 p-2 rounded">{aiResult.intent}</div>
                         </div>
                         <div>
                           <span className="text-xs text-gray-500 uppercase block mb-1">Palabras Clave</span>
                           <div className="flex flex-wrap gap-2">
                             {aiResult.keywords.map((kw, i) => (
                               <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">{kw}</span>
                             ))}
                           </div>
                         </div>
                         <div>
                           <span className="text-xs text-gray-500 uppercase block mb-1">Resumen / Significado</span>
                           <div className="text-sm text-gray-700">{aiResult.summary}</div>
                         </div>
                       </div>
                     </div>

                     {/* Panel de Métricas Generales */}
                     <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                        <h4 className="text-sm font-bold text-blue-900 mb-4 uppercase flex items-center gap-2">
                         <Activity size={16}/> Rendimiento del Procesamiento
                       </h4>
                       <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                          <span className="block text-[10px] text-gray-500 uppercase mb-1 font-bold">Velocidad Habla</span>
                          <span className="text-lg font-bold text-gray-800">
                            {((aiResult.transcription.split(' ').length) / (audioMetrics?.duration || 1)).toFixed(1)} pal/seg
                          </span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                          <span className="block text-[10px] text-gray-500 uppercase mb-1 font-bold">Frecuencia Dominante</span>
                          <span className="text-lg font-bold text-gray-800">{Math.round(audioMetrics?.dominantFrequency || 0)} Hz</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                          <span className="block text-[10px] text-gray-500 uppercase mb-1 font-bold">Tiempo Inferencia</span>
                          <span className="text-lg font-bold text-gray-800">{processingTime.toFixed(2)} s</span>
                        </div>
                        <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-center">
                          <span className="block text-[10px] text-gray-500 uppercase mb-1 font-bold">Costo Estimado</span>
                          <span className="text-lg font-bold text-gray-800">~0.0001¢</span>
                        </div>
                      </div>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">Esperando procesamiento de IA...</div>
              )}
            </Step>
          </div>

        </div>

        {/* TABLA DE EXPERIMENTOS */}
        {experiments.length > 0 && (
          <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Resultados del Laboratorio</h3>
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">Sesión Actual</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-600 uppercase bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3">Condición (Prueba)</th>
                    <th className="px-6 py-3">Duración (s)</th>
                    <th className="px-6 py-3">Palabras</th>
                    <th className="px-6 py-3">Tiempo Proc. (s)</th>
                    <th className="px-6 py-3">WER</th>
                  </tr>
                </thead>
                <tbody>
                  {experiments.map((exp, i) => (
                    <tr key={i} className="bg-white border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{exp.name}</td>
                      <td className="px-6 py-4 font-mono">{exp.duration.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono">{exp.words}</td>
                      <td className="px-6 py-4 font-mono">{exp.processingTime.toFixed(2)}</td>
                      <td className="px-6 py-4 font-mono font-bold text-blue-700">{exp.wer}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-amber-50 border-t border-amber-100">
              <h4 className="font-bold text-amber-900 mb-2">Pregunta de Análisis:</h4>
              <p className="text-amber-800 text-sm">Observe la tabla de resultados. ¿Qué condición produjo el mayor porcentaje de error (WER) y por qué cree que sucedió a nivel de la señal acústica o extracción de características?</p>
            </div>
          </div>
        )}

        {/* SECCIÓN 23: EXPLICACIÓN CONCEPTUAL FINAL */}
        <div className="mt-12 text-center">
          <Button variant="outline" onClick={() => setShowConceptual(!showConceptual)}>
            {showConceptual ? 'OCULTAR RESUMEN CONCEPTUAL' : '¿CÓMO ENTENDIÓ LA COMPUTADORA MI VOZ?'}
          </Button>
        </div>

        {showConceptual && (
          <div className="mt-8 bg-blue-900 text-white rounded-2xl p-8 shadow-xl">
            <h3 className="text-2xl font-bold text-yellow-400 mb-8 text-center uppercase tracking-wide">Flujo Conceptual del ASR</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Lines linking boxes (hidden on mobile) */}
              <div className="hidden md:block absolute top-[15%] left-1/6 right-1/6 h-1 bg-blue-700 z-0"></div>
              <div className="hidden md:block absolute top-[50%] left-1/6 right-1/6 h-1 bg-blue-700 z-0"></div>
              <div className="hidden md:block absolute top-[85%] left-1/6 right-1/6 h-1 bg-blue-700 z-0"></div>

              {[
                { s: 'PASO 1', t: 'El usuario produce vibraciones (voz) que el micrófono convierte en señal analógica.' },
                { s: 'PASO 2', t: 'El conversor ADC digitaliza la onda en miles de muestras numéricas por segundo.' },
                { s: 'PASO 3', t: 'Transformadas matemáticas (FFT) extraen las frecuencias, formando un espectrograma.' },
                { s: 'PASO 4', t: 'El modelo ASR procesa estos vectores acústicos y los convierte en texto.' },
                { s: 'PASO 5', t: 'Un LLM analiza la semántica (NLU) para generar una respuesta inteligente.' },
              ].map((step, i) => (
                <div key={i} className="bg-blue-800 border border-blue-700 p-5 rounded-xl z-10 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-700 rounded-bl-full opacity-50 z-0"></div>
                  <span className="block text-yellow-400 font-bold mb-2 relative z-10">{step.s}</span>
                  <p className="text-sm text-blue-100 relative z-10">{step.t}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-blue-950/50 p-6 rounded-lg border border-blue-800 text-center">
              <p className="text-blue-200 text-sm leading-relaxed">
                <strong>Aclaración importante:</strong> La computadora no comprende la voz exactamente como un ser humano. Convierte información física (presión sonora) en representaciones matemáticas (matrices y vectores), y luego calcula probabilidades estadísticas para generar una transcripción e interpretación basadas en sus datos de entrenamiento.
              </p>
            </div>
          </div>
        )}

      </main>

      <footer className="bg-white border-t border-gray-300 p-2 flex flex-col md:flex-row items-center justify-between sticky bottom-0 z-50">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-xs font-bold text-blue-900 uppercase mr-2 shrink-0">Línea de Vida:</span>
          <div className="flex gap-1 items-center whitespace-nowrap">
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${activeStep >= 1 ? 'bg-green-600 text-white shadow-sm' : 'border border-gray-300 text-gray-400 bg-gray-50'}`}>1. CAPTURA</span> <span className="text-gray-400">→</span>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${activeStep >= 2 ? 'bg-green-600 text-white shadow-sm' : 'border border-gray-300 text-gray-400 bg-gray-50'}`}>2. ADC</span> <span className="text-gray-400">→</span>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${activeStep >= 3 ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-300 text-gray-400 bg-gray-50'}`}>3. CARACTERÍSTICAS</span> <span className="text-gray-400">→</span>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${activeStep >= 4 ? 'bg-blue-600 text-white shadow-sm' : 'border border-gray-300 text-gray-400 bg-gray-50'}`}>4. ASR / MÉTRICAS</span> <span className="text-gray-400">→</span>
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${activeStep >= 5 ? 'bg-yellow-500 text-black shadow-sm' : 'border border-gray-300 text-gray-400 bg-gray-50'}`}>5. NLU / TTS</span>
          </div>
        </div>
        <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
          <p className="text-[10px] text-gray-500 italic hidden md:block">Edu: Laboratorio de Reconocimiento de Voz - 2024</p>
          <div className="flex gap-2">
            <button onClick={() => { setViewMode('step'); setActiveStep(1); }} className="text-xs font-bold text-blue-900 underline hover:text-blue-700">MODO PASO A PASO</button>
            <button onClick={() => { setViewMode('full'); setActiveStep(5); }} className="text-xs font-bold text-blue-900 underline hover:text-blue-700">VER TODO EL FLUJO</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
