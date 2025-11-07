'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Pause, Play, Check, RotateCcw, Edit2 } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptComplete: (text: string) => void;
  placeholder?: string;
  initialValue?: string;
}

export default function VoiceRecorder({ onTranscriptComplete, placeholder, initialValue = '' }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState(initialValue);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const processedResultIndexRef = useRef<number>(0);
  const isRestartingRef = useRef<boolean>(false);

  useEffect(() => {
    if (initialValue) {
      setTranscript(initialValue);
      setIsValidated(true);
    }
  }, [initialValue]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR';

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (i < processedResultIndexRef.current) {
            continue;
          }

          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptPart + ' ';
            processedResultIndexRef.current = i + 1;
          } else {
            interim += transcriptPart;
          }
        }

        if (final) {
          setTranscript(prev => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          return;
        }

        let message = '';
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            message = 'Accès au microphone refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.';
            break;
          case 'network':
            message = 'Erreur réseau. Vérifiez votre connexion internet.';
            break;
          case 'aborted':
            message = 'Reconnaissance vocale interrompue.';
            break;
          default:
            message = `Erreur: ${event.error}. Sur mobile, HTTPS est requis pour la reconnaissance vocale.`;
        }

        setErrorMessage(message);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening && !isPaused && !isRestartingRef.current) {
          isRestartingRef.current = true;
          setTimeout(() => {
            if (isListening && !isPaused) {
              try {
                recognition.start();
              } catch (error) {
                console.error('Failed to restart recognition:', error);
              }
            }
            isRestartingRef.current = false;
          }, 100);
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, isPaused]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      setIsValidated(false);
      setIsEditing(false);
      setErrorMessage('');
      processedResultIndexRef.current = 0;
      isRestartingRef.current = false;
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setIsPaused(false);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setErrorMessage('Impossible de démarrer la reconnaissance vocale. Assurez-vous d\'être en HTTPS sur mobile.');
      }
    }
  };

  const pauseListening = () => {
    if (recognitionRef.current && isListening) {
      isRestartingRef.current = false;
      recognitionRef.current.stop();
      setIsPaused(true);
    }
  };

  const resumeListening = () => {
    if (recognitionRef.current && isPaused) {
      isRestartingRef.current = false;
      try {
        recognitionRef.current.start();
        setIsPaused(false);
      } catch (error) {
        console.error('Failed to resume recognition:', error);
        setErrorMessage('Impossible de reprendre la reconnaissance vocale.');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      isRestartingRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setIsPaused(false);
      setInterimTranscript('');
    }
  };

  const handleValidate = () => {
    const finalText = transcript.trim();
    if (finalText) {
      onTranscriptComplete(finalText);
      setIsValidated(true);
      setIsEditing(false);
      stopListening();
    }
  };

  const handleReset = () => {
    setTranscript('');
    setInterimTranscript('');
    setIsValidated(false);
    setIsEditing(false);
    if (isListening) {
      stopListening();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsValidated(false);
  };

  const handleSaveEdit = () => {
    const finalText = transcript.trim();
    if (finalText) {
      onTranscriptComplete(finalText);
      setIsValidated(true);
      setIsEditing(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <p className="text-sm text-amber-800 mb-2">
            La reconnaissance vocale n'est pas supportée par votre navigateur.
          </p>
          <p className="text-xs text-amber-700">
            Navigateurs compatibles: Chrome/Edge (Android), Safari 14.5+ (iOS).
            HTTPS est requis sur mobile.
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <p className="text-sm text-red-800">{errorMessage}</p>
            {errorMessage.includes('HTTPS') && (
              <p className="text-xs text-red-700 mt-2">
                Pour utiliser la dictée vocale sur mobile, déployez l'application sur Vercel (HTTPS automatique) ou utilisez un tunnel HTTPS local.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      <Card className={`transition-all ${
        isListening ? 'ring-2 ring-red-500 ring-offset-2' :
        isValidated ? 'ring-2 ring-green-500 ring-offset-2' : ''
      }`}>
        <CardContent className="pt-6">
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={8}
                className="w-full"
                placeholder="Modifiez votre texte..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setIsValidated(true);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
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
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {transcript}
                    {interimTranscript && (
                      <span className="text-gray-400 italic">{interimTranscript}</span>
                    )}
                  </p>
                  {isValidated && (
                    <Button
                      onClick={handleEdit}
                      variant="ghost"
                      size="sm"
                      className="mt-3"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Modifier le texte
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-gray-400">
                  <Mic className="h-12 w-12 mb-4" />
                  <p className="text-center">
                    {placeholder || "Cliquez sur le micro pour commencer à dicter"}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isEditing && (
        <div className="flex flex-wrap gap-3 justify-center">
          {!isListening && !transcript && (
            <Button
              onClick={startListening}
              size="lg"
              className="bg-red-600 hover:bg-red-700"
            >
              <Mic className="h-5 w-5 mr-2" />
              Commencer la Dictée
            </Button>
          )}

          {isListening && !isPaused && (
            <>
              <Button
                onClick={pauseListening}
                size="lg"
                variant="outline"
              >
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </Button>
              <Button
                onClick={stopListening}
                size="lg"
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <MicOff className="h-5 w-5 mr-2" />
                Arrêter
              </Button>
            </>
          )}

          {isPaused && (
            <>
              <Button
                onClick={resumeListening}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <Play className="h-5 w-5 mr-2" />
                Reprendre
              </Button>
              <Button
                onClick={stopListening}
                size="lg"
                variant="outline"
              >
                <MicOff className="h-5 w-5 mr-2" />
                Terminer
              </Button>
            </>
          )}

          {transcript && !isListening && !isValidated && (
            <>
              <Button
                onClick={handleReset}
                size="lg"
                variant="outline"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Recommencer
              </Button>
              <Button
                onClick={handleValidate}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-5 w-5 mr-2" />
                Valider
              </Button>
            </>
          )}

          {transcript && isListening && (
            <Button
              onClick={handleReset}
              size="lg"
              variant="outline"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Recommencer
            </Button>
          )}

          {isValidated && !isListening && (
            <Button
              onClick={handleReset}
              size="lg"
              variant="outline"
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Recommencer
            </Button>
          )}
        </div>
      )}

      {isListening && (
        <div className="flex items-center justify-center gap-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-75" />
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-150" />
          </div>
          <span className="text-sm text-red-600 font-medium">
            Enregistrement en cours...
          </span>
        </div>
      )}
    </div>
  );
}
