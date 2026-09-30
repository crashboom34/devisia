'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Pause, Play, Check, RotateCcw, Edit2, AlertCircle } from 'lucide-react';
import { collectSpeechResults } from '@/lib/voice-transcript';

interface VoiceRecorderProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export default function VoiceRecorder({ value, onChange, placeholder, ariaLabel = 'Texte dicté' }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [transcript, setTranscript] = useState(value);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [duration, setDuration] = useState(0);

  const descriptionId = useId();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isListeningRef = useRef(false);
  const isPausedRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);
  const isRestartingRef = useRef(false);
  const resumeRequestedRef = useRef(false);
  const ignoreResultsRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleStartRef = useRef<((delay: number) => void) | null>(null);
  const finalTextRef = useRef('');
  const onChangeRef = useRef(onChange);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionFinalCountRef = useRef(0);

  onChangeRef.current = onChange;

  useEffect(() => {
    setTranscript(value);
    finalTextRef.current = value;
  }, [value]);

  useEffect(() => {
    setIsValidated(!!value);
  }, [value]);

  useEffect(() => {
    if (isListening && !isPaused) {
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening, isPaused]);

  const formatDuration = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const speechWindow = window as typeof window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    const scheduleStart = (delay: number) => {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      isRestartingRef.current = true;
      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;
        if (isListeningRef.current && (!isPausedRef.current || resumeRequestedRef.current) && !isRecognitionActiveRef.current) {
          try {
            recognition.start();
          } catch {
            isListeningRef.current = false;
            resumeRequestedRef.current = false;
            setIsListening(false);
            setIsPaused(false);
            setIsResuming(false);
            setErrorMessage('Impossible de reprendre la dictée. Réessayez avec le bouton micro.');
          }
        }
        isRestartingRef.current = false;
      }, delay);
    };
    scheduleStartRef.current = scheduleStart;

    recognition.onstart = () => {
      isRecognitionActiveRef.current = true;
      sessionFinalCountRef.current = 0;
      if (!isListeningRef.current || (isPausedRef.current && !resumeRequestedRef.current)) {
        recognition.stop();
        return;
      }
      if (resumeRequestedRef.current) {
        resumeRequestedRef.current = false;
        isPausedRef.current = false;
        setIsPaused(false);
        setIsResuming(false);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      if (ignoreResultsRef.current) return;
      const { final: sessionFinal, interim: currentInterim, processed } = collectSpeechResults(event.results, sessionFinalCountRef.current);
      sessionFinalCountRef.current = processed;

      if (sessionFinal) {
        const base = finalTextRef.current.trim();
        const updated = base ? base + ' ' + sessionFinal : sessionFinal;
        finalTextRef.current = updated;
        setTranscript(updated);
        setInterimText('');
        onChangeRef.current(updated);
      }

      setInterimText(isPausedRef.current ? '' : currentInterim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      isRecognitionActiveRef.current = false;

      if (event.error === 'no-speech') return;

      if (event.error === 'aborted') {
        if (isPausedRef.current || !isListeningRef.current || isRestartingRef.current) return;
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }

      let message = '';
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          message = 'Acces au microphone refuse. Veuillez autoriser l\'acces dans les parametres de votre navigateur.';
          break;
        case 'network':
          message = 'Erreur reseau. Verifiez votre connexion internet.';
          break;
        default:
          message = `Erreur: ${event.error}. Sur mobile, HTTPS est requis pour la reconnaissance vocale.`;
      }

      setErrorMessage(message);
      setIsListening(false);
      isListeningRef.current = false;
      isPausedRef.current = false;
      resumeRequestedRef.current = false;
      setIsPaused(false);
      setIsResuming(false);
    };

    recognition.onend = () => {
      isRecognitionActiveRef.current = false;

      if (isListeningRef.current && resumeRequestedRef.current) {
        scheduleStart(200);
      } else if (isListeningRef.current && !isPausedRef.current && !isRestartingRef.current) {
        scheduleStart(250);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      resumeRequestedRef.current = false;
      ignoreResultsRef.current = true;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      scheduleStartRef.current = null;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isListening || isRecognitionActiveRef.current) return;

    finalTextRef.current = value.trim();
    sessionFinalCountRef.current = 0;
    setInterimText('');
    setIsValidated(false);
    setIsEditing(false);
    setErrorMessage('');
    setDuration(0);
    isRestartingRef.current = false;
    ignoreResultsRef.current = false;
    isListeningRef.current = true;
    isPausedRef.current = false;

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setIsPaused(false);
      setIsResuming(false);
    } catch (error: unknown) {
      isListeningRef.current = false;
      isRecognitionActiveRef.current = false;
      if (error instanceof DOMException && error.name === 'InvalidStateError') {
        setErrorMessage('La reconnaissance vocale est deja en cours. Veuillez attendre.');
      } else {
        setErrorMessage('Impossible de demarrer la reconnaissance vocale. Assurez-vous d\'etre en HTTPS sur mobile.');
      }
    }
  };

  const pauseListening = () => {
    if (recognitionRef.current && isListening) {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
      isRestartingRef.current = false;
      setIsPaused(true);
      isPausedRef.current = true;
      setInterimText('');
      if (isRecognitionActiveRef.current) recognitionRef.current.stop();
    }
  };

  const resumeListening = () => {
    if (recognitionRef.current && isPaused && !resumeRequestedRef.current) {
      resumeRequestedRef.current = true;
      setIsResuming(true);
      setErrorMessage('');
      if (!isRecognitionActiveRef.current) scheduleStartRef.current?.(200);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
      isRestartingRef.current = false;
      resumeRequestedRef.current = false;
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      setIsListening(false);
      isListeningRef.current = false;
      setIsPaused(false);
      isPausedRef.current = false;
      setIsResuming(false);
      setInterimText('');
    }
  };

  const handleValidate = () => {
    const finalText = transcript.trim();
    if (finalText) {
      onChangeRef.current(finalText);
      setIsValidated(true);
      setIsEditing(false);
      stopListening();
    }
  };

  const handleReset = () => {
    ignoreResultsRef.current = true;
    if (isListening) stopListening();
    setTranscript('');
    setInterimText('');
    setIsValidated(false);
    setIsEditing(false);
    setDuration(0);
    finalTextRef.current = '';
    sessionFinalCountRef.current = 0;
    onChangeRef.current('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsValidated(false);
  };

  const handleSaveEdit = () => {
    const finalText = transcript.trim();
    if (finalText) {
      finalTextRef.current = finalText;
      onChangeRef.current(finalText);
      setIsValidated(true);
      setIsEditing(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-yellow-900/20 border-yellow-700" role="status">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 mb-1 font-medium">
                Reconnaissance vocale non disponible
              </p>
              <p className="text-xs text-yellow-500">
                Navigateurs compatibles: Chrome/Edge (Android), Safari 14.5+ (iOS). HTTPS requis sur mobile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayText = transcript + (interimText ? ` ${interimText}` : '');
  const wordCount = displayText.trim() ? displayText.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Card className="bg-red-900/20 border-red-700" role="alert" aria-live="assertive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400">{errorMessage}</p>
                {errorMessage.includes('HTTPS') && (
                  <p className="text-xs text-red-500 mt-1">
                    Pour la dictee vocale sur mobile, HTTPS est obligatoire.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={`transition-all bg-brand-darkCard border-gray-800 ${
        isListening ? 'ring-2 ring-red-500/70 shadow-lg shadow-red-500/10' :
        isValidated ? 'ring-2 ring-brand-green shadow-lg shadow-brand-green/10' : ''
      }`}>
        <CardContent className="pt-6">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                aria-label={ariaLabel}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                className="w-full bg-brand-darkLight border-gray-700 text-white placeholder:text-gray-500"
                placeholder="Modifiez votre texte..."
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={() => { setIsEditing(false); setIsValidated(true); }}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-brand-darkLight"
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveEdit}
                  size="sm"
                  className="bg-brand-green hover:bg-green-600 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          ) : (
            <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
              {displayText ? (
                <div>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {transcript}
                    {interimText && (
                      <span className="text-gray-500 italic"> {interimText}</span>
                    )}
                  </p>
                  {isValidated && (
                    <Button
                      type="button"
                      onClick={handleEdit}
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-gray-400 hover:text-white hover:bg-brand-darkLight"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier le texte
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-500">
                  <div className="relative">
                    <Mic className="h-12 w-12 mb-4" />
                  </div>
                  <p className="text-center text-gray-400">
                    {placeholder || "Cliquez sur le micro pour commencer \u00e0 dicter"}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Parlez clairement en direction de votre microphone
                  </p>
                </div>
              )}
            </div>
          )}

          {(isListening || wordCount > 0) && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {isListening && (
                  <span className="font-mono">{formatDuration(duration)}</span>
                )}
                {wordCount > 0 && (
                  <span>{wordCount} mot{wordCount > 1 ? 's' : ''}</span>
                )}
              </div>
              {isListening && (
                <div className="flex items-center gap-2">
                  {!isPaused && <div className="flex space-x-1" aria-hidden="true">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-150" />
                  </div>}
                  <span role="status" className="text-xs text-red-400 font-medium">
                    {isResuming ? 'Reprise du micro…' : isPaused ? 'En pause, micro arrêté' : 'À l’écoute…'}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isEditing && (
        <div className="flex flex-wrap gap-3 justify-center">
          {!isListening && (
            <Button type="button" onClick={startListening} size="lg" className="bg-red-600 hover:bg-red-700 text-white" aria-describedby={descriptionId}>
              <Mic className="h-5 w-5 mr-2" />
              {transcript ? 'Continuer la dictée' : 'Commencer la dictée'}
            </Button>
          )}

          {isListening && !isPaused && (
            <>
              <Button type="button" onClick={pauseListening} size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-brand-darkLight">
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
              <Button type="button" onClick={stopListening} size="lg" variant="outline" className="text-red-400 border-red-600 hover:bg-red-900/20">
                <MicOff className="h-5 w-5 mr-2" />
                Arreter
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button type="button" onClick={resumeListening} disabled={isResuming} size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                <Play className="h-5 w-5 mr-2" />
                {isResuming ? 'Reprise…' : 'Reprendre'}
              </Button>
              <Button type="button" onClick={stopListening} size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-brand-darkLight">
                <MicOff className="h-5 w-5 mr-2" />
                Terminer
              </Button>
            </>
          )}

          {transcript && !isListening && !isValidated && (
            <>
              <Button type="button" onClick={handleReset} size="lg" variant="outline" className="border-gray-700 text-gray-300 hover:bg-brand-darkLight">
                <RotateCcw className="h-5 w-5 mr-2" />
                Recommencer
              </Button>
              <Button type="button" onClick={handleValidate} size="lg" className="bg-brand-green hover:bg-green-600 text-white">
                <Check className="h-5 w-5 mr-2" />
                Valider
              </Button>
            </>
          )}

          {transcript && isListening && (
            <Button type="button" onClick={handleReset} size="lg" variant="outline">
              <RotateCcw className="h-5 w-5 mr-2" />
              Recommencer
            </Button>
          )}

          {isValidated && !isListening && (
            <Button type="button" onClick={handleReset} size="lg" variant="outline">
              <RotateCcw className="h-5 w-5 mr-2" />
              Recommencer
            </Button>
          )}
        </div>
      )}
      <p id={descriptionId} className="sr-only">
        La dictée utilise le microphone de votre appareil. Vous pourrez relire et modifier le texte avant de le valider.
      </p>
    </div>
  );
}
