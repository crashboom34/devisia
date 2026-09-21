'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Pause, Play, Check, RotateCcw, Edit2, AlertCircle } from 'lucide-react';
import {
  RecognitionLifecycle,
  processRecognitionEvent,
  type RecognitionEventLike,
  type RecognitionFailure,
  type SpeechRecognitionLike,
} from '@/lib/voice/recognition-lifecycle';

interface VoiceRecorderProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

const ERROR_MESSAGES: Record<RecognitionFailure, string> = {
  'audio-capture': 'Aucun microphone n’est disponible. Vérifiez qu’il est connecté et autorisé.',
  'language-not-supported': 'La dictée en français n’est pas disponible dans ce navigateur.',
  network: 'La dictée a été interrompue par un problème réseau. Vérifiez votre connexion puis réessayez.',
  'not-allowed': 'L’accès au microphone a été refusé. Autorisez-le dans les réglages du navigateur puis réessayez.',
  'restart-failed': 'La dictée s’est interrompue. Relancez-la pour continuer.',
  'resume-failed': 'Impossible de reprendre la dictée. Terminez cette session puis recommencez.',
  'service-not-allowed': 'Le service de dictée est bloqué par les réglages du navigateur ou de l’appareil.',
  'start-failed': 'Impossible de démarrer la dictée. Vérifiez le microphone puis réessayez.',
  'start-invalid-state': 'La dictée est déjà en cours. Patientez un instant puis réessayez.',
  unknown: 'La dictée a rencontré un problème. Réessayez dans quelques instants.',
};

export default function VoiceRecorder({ value, onChange, placeholder, ariaLabel = 'Texte dicté' }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState(value);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [duration, setDuration] = useState(0);

  const descriptionId = useId();
  const lifecycleRef = useRef<RecognitionLifecycle | null>(null);
  const finalTextRef = useRef('');
  const lastFinalChunkRef = useRef('');
  const lastEmittedValueRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const processedFinalResultsRef = useRef(new Set<string>());

  onChangeRef.current = onChange;

  useEffect(() => {
    setTranscript(value);
    finalTextRef.current = value;
    if (lastEmittedValueRef.current === value) {
      lastEmittedValueRef.current = null;
      return;
    }
    setIsValidated(Boolean(value));
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

    const handleResult = (event: RecognitionEventLike) => {
      const processed = processRecognitionEvent(
        event,
        processedFinalResultsRef.current,
        lastFinalChunkRef.current,
      );
      lastFinalChunkRef.current = processed.lastFinalChunk;

      if (processed.finalText) {
        const base = finalTextRef.current.trim();
        const updated = base ? `${base} ${processed.finalText}` : processed.finalText;
        finalTextRef.current = updated;
        setTranscript(updated);
        setInterimText('');
        lastEmittedValueRef.current = updated;
        onChangeRef.current(updated);
      }

      if (processed.interimText) {
        setInterimText(processed.interimText);
      } else if (!processed.finalText) {
        setInterimText('');
      }
    };

    const lifecycle = new RecognitionLifecycle(recognition, {
      onError: (failure) => setErrorMessage(ERROR_MESSAGES[failure]),
      onResult: handleResult,
      onSessionStart: () => processedFinalResultsRef.current.clear(),
      onStatusChange: ({ isListening: listening, isPaused: paused }) => {
        setIsListening(listening);
        setIsPaused(paused);
        if (!listening || paused) setInterimText('');
      },
    });
    lifecycleRef.current = lifecycle;

    return () => {
      lifecycle.destroy();
      lifecycleRef.current = null;
    };
  }, []);

  const startListening = () => {
    if (!lifecycleRef.current || isListening) return;

    finalTextRef.current = value.trim();
    lastFinalChunkRef.current = '';
    processedFinalResultsRef.current.clear();
    setInterimText('');
    setIsValidated(false);
    setIsEditing(false);
    setErrorMessage('');
    setDuration(0);
    lifecycleRef.current.start();
  };

  const pauseListening = () => {
    lifecycleRef.current?.pause();
  };

  const resumeListening = () => {
    processedFinalResultsRef.current.clear();
    lifecycleRef.current?.resume();
  };

  const stopListening = () => {
    lifecycleRef.current?.stop();
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
    processedFinalResultsRef.current.clear();
    if (isListening) stopListening();
    lastEmittedValueRef.current = '';
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
      lastEmittedValueRef.current = finalText;
      onChangeRef.current(finalText);
      setIsValidated(true);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setTranscript(finalTextRef.current);
    setIsEditing(false);
    setIsValidated(Boolean(finalTextRef.current));
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
                Utilisez un navigateur compatible ou choisissez la saisie texte pour continuer.
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
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                className="w-full bg-brand-darkLight border-gray-700 text-white placeholder:text-gray-500"
                placeholder="Modifiez votre texte..."
                aria-label={ariaLabel}
                aria-describedby={descriptionId}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCancelEdit}
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
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="text-xs text-red-400 font-medium" role="status" aria-live="polite">
                    {isPaused ? 'Dictée en pause' : 'Écoute en cours…'}
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
            <Button type="button" onClick={startListening} size="lg" className="bg-red-600 hover:bg-red-700 text-white" aria-describedby={descriptionId}>
              <Mic className="h-5 w-5 mr-2" />
              Commencer la dictée
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
                Arrêter
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button type="button" onClick={resumeListening} size="lg" className="bg-red-600 hover:bg-red-700 text-white">
                <Play className="h-5 w-5 mr-2" />
                Reprendre
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
