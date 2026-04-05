'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Pause, Play, Check, RotateCcw, CreditCard as Edit2, CircleAlert as AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function VoiceRecorder({ value, onChange, placeholder }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState(value);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [duration, setDuration] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const isPausedRef = useRef(false);
  const isRecognitionActiveRef = useRef(false);
  const isRestartingRef = useRef(false);
  const finalTextRef = useRef('');
  const lastFinalChunkRef = useRef('');
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';

    recognition.onstart = () => {
      isRecognitionActiveRef.current = true;
      sessionFinalCountRef.current = 0;
    };

    recognition.onresult = (event: any) => {
      let sessionFinal = '';
      let currentInterim = '';

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript.trim();
        if (!text) continue;

        if (result.isFinal) {
          if (i >= sessionFinalCountRef.current) {
            const deduped = deduplicateChunk(text, lastFinalChunkRef.current);
            if (deduped) {
              sessionFinal += (sessionFinal ? ' ' : '') + deduped;
              lastFinalChunkRef.current = deduped;
            }
            sessionFinalCountRef.current = i + 1;
          }
        } else {
          currentInterim = text;
        }
      }

      if (sessionFinal) {
        const base = finalTextRef.current.trim();
        const updated = base ? base + ' ' + sessionFinal : sessionFinal;
        finalTextRef.current = updated;
        setTranscript(updated);
        setInterimText('');
        onChangeRef.current(updated);
      }

      if (currentInterim) {
        setInterimText(currentInterim);
      } else if (!sessionFinal) {
        setInterimText('');
      }
    };

    recognition.onerror = (event: any) => {
      isRecognitionActiveRef.current = false;

      if (event.error === 'no-speech') return;

      if (event.error === 'aborted') {
        if (!isRestartingRef.current) {
          setIsListening(false);
          isListeningRef.current = false;
          isPausedRef.current = false;
        }
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
    };

    recognition.onend = () => {
      isRecognitionActiveRef.current = false;

      if (isListeningRef.current && !isPausedRef.current && !isRestartingRef.current) {
        isRestartingRef.current = true;
        setTimeout(() => {
          if (isListeningRef.current && !isPausedRef.current && !isRecognitionActiveRef.current) {
            try {
              recognition.start();
            } catch {
              setIsListening(false);
              isListeningRef.current = false;
              setErrorMessage('Impossible de redemarrer la reconnaissance vocale.');
            }
          }
          isRestartingRef.current = false;
        }, 250);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  const deduplicateChunk = (newChunk: string, previousChunk: string): string => {
    if (!previousChunk || !newChunk) return newChunk;
    if (newChunk === previousChunk) return '';

    const newWords = newChunk.split(/\s+/);
    const prevWords = previousChunk.split(/\s+/);

    const cleaned: string[] = [];
    for (const word of newWords) {
      if (word !== cleaned[cleaned.length - 1]) {
        cleaned.push(word);
      }
    }

    const overlap = Math.min(prevWords.length, cleaned.length);
    for (let size = overlap; size >= 3; size--) {
      const prevTail = prevWords.slice(-size).join(' ').toLowerCase();
      const newHead = cleaned.slice(0, size).join(' ').toLowerCase();
      if (prevTail === newHead) {
        return cleaned.slice(size).join(' ');
      }
    }

    return cleaned.join(' ');
  };

  const startListening = () => {
    if (!recognitionRef.current || isListening || isRecognitionActiveRef.current) return;

    finalTextRef.current = value.trim();
    lastFinalChunkRef.current = '';
    sessionFinalCountRef.current = 0;
    setInterimText('');
    setIsValidated(false);
    setIsEditing(false);
    setErrorMessage('');
    setDuration(0);
    isRestartingRef.current = false;

    try {
      recognitionRef.current.start();
      setIsListening(true);
      isListeningRef.current = true;
      setIsPaused(false);
      isPausedRef.current = false;
    } catch (error: any) {
      isListeningRef.current = false;
      isRecognitionActiveRef.current = false;
      if (error?.name === 'InvalidStateError') {
        setErrorMessage('La reconnaissance vocale est deja en cours. Veuillez attendre.');
      } else {
        setErrorMessage('Impossible de demarrer la reconnaissance vocale. Assurez-vous d\'etre en HTTPS sur mobile.');
      }
    }
  };

  const pauseListening = () => {
    if (recognitionRef.current && isListening) {
      isRestartingRef.current = false;
      recognitionRef.current.stop();
      setIsPaused(true);
      isPausedRef.current = true;
      setInterimText('');
    }
  };

  const resumeListening = () => {
    if (recognitionRef.current && isPaused && !isRecognitionActiveRef.current) {
      isRestartingRef.current = false;
      sessionFinalCountRef.current = 0;
      try {
        recognitionRef.current.start();
        setIsPaused(false);
        isPausedRef.current = false;
      } catch {
        setErrorMessage('Impossible de reprendre la reconnaissance vocale.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      isRestartingRef.current = false;
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      setIsListening(false);
      isListeningRef.current = false;
      setIsPaused(false);
      isPausedRef.current = false;
      isRecognitionActiveRef.current = false;
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
    setTranscript('');
    setInterimText('');
    setIsValidated(false);
    setIsEditing(false);
    setDuration(0);
    finalTextRef.current = '';
    lastFinalChunkRef.current = '';
    sessionFinalCountRef.current = 0;
    if (isListening) stopListening();
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
      <Card className="bg-yellow-900/20 border-yellow-700">
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
        <Card className="bg-red-900/20 border-red-700">
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

      <Card className={`transition-all bg-white border-gray-200 ${
        isListening ? 'ring-2 ring-red-500/70 shadow-lg shadow-red-500/10' :
        isValidated ? 'ring-2 ring-brand-green shadow-lg shadow-brand-green/10' : ''
      }`}>
        <CardContent className="pt-6">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                className="w-full bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500"
                placeholder="Modifiez votre texte..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => { setIsEditing(false); setIsValidated(true); }}
                  variant="outline"
                  size="sm"
                  className="border-gray-200 text-gray-600 hover:bg-gray-100"
                >
                  Annuler
                </Button>
                <Button
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
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {transcript}
                    {interimText && (
                      <span className="text-gray-500 italic"> {interimText}</span>
                    )}
                  </p>
                  {isValidated && (
                    <Button
                      onClick={handleEdit}
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
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
                  <p className="text-center text-gray-500">
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
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
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
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="text-xs text-red-400 font-medium">
                    {isPaused ? 'En pause' : 'Ecoute...'}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isEditing && (
        <div className="flex flex-wrap gap-3 justify-center">
          {!isListening && !transcript && (
            <Button onClick={startListening} size="lg" className="bg-red-600 hover:bg-red-700 text-white">
              <Mic className="h-5 w-5 mr-2" />
              Commencer la Dictee
            </Button>
          )}

          {isListening && !isPaused && (
            <>
              <Button onClick={pauseListening} size="lg" variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
              <Button onClick={stopListening} size="lg" variant="outline" className="text-red-400 border-red-600 hover:bg-red-900/20">
                <MicOff className="h-5 w-5 mr-2" />
                Arreter
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button onClick={resumeListening} size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                <Play className="h-5 w-5 mr-2" />
                Reprendre
              </Button>
              <Button onClick={stopListening} size="lg" variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
                <MicOff className="h-5 w-5 mr-2" />
                Terminer
              </Button>
            </>
          )}

          {transcript && !isListening && !isValidated && (
            <>
              <Button onClick={handleReset} size="lg" variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-100">
                <RotateCcw className="h-5 w-5 mr-2" />
                Recommencer
              </Button>
              <Button onClick={handleValidate} size="lg" className="bg-brand-green hover:bg-green-600 text-white">
                <Check className="h-5 w-5 mr-2" />
                Valider
              </Button>
            </>
          )}

          {transcript && isListening && (
            <Button onClick={handleReset} size="lg" variant="outline">
              <RotateCcw className="h-5 w-5 mr-2" />
              Recommencer
            </Button>
          )}

          {isValidated && !isListening && (
            <Button onClick={handleReset} size="lg" variant="outline">
              <RotateCcw className="h-5 w-5 mr-2" />
              Recommencer
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
