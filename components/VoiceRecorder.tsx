'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Pause, Play, Check, RotateCcw, Edit2 } from 'lucide-react';

interface VoiceRecorderProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export default function VoiceRecorder({ value, onChange, placeholder }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState(value);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const isRestartingRef = useRef<boolean>(false);
  const isListeningRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const baseTextRef = useRef<string>('');

  useEffect(() => {
    setTranscript(value);
  }, [value]);

  useEffect(() => {
    if (value) {
      setIsValidated(true);
    } else {
      setIsValidated(false);
    }
  }, [value]);

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

      recognition.onstart = () => {
        console.log('[VoiceRecorder] onstart - Recognition started');
        isRecognitionActiveRef.current = true;
      };

      recognition.onresult = (event: any) => {
        console.log('[VoiceRecorder] ========================================');
        console.log('[VoiceRecorder] onresult - resultIndex:', event.resultIndex, 'totalResults:', event.results.length);

        // Log ALL results to understand what the browser sends
        for (let i = 0; i < event.results.length; i++) {
          console.log('[VoiceRecorder] Result[' + i + '] - isFinal:', event.results[i].isFinal, '- text:', event.results[i][0].transcript);
        }

        // ✅ VRAIE SOLUTION : N'UTILISER QUE LE DERNIER RÉSULTAT
        const lastIndex = event.results.length - 1;
        const lastResult = event.results[lastIndex];
        const lastTranscript = lastResult[0].transcript;
        const isLastFinal = lastResult.isFinal;

        console.log('[VoiceRecorder] Using ONLY last result[' + lastIndex + '] - isFinal:', isLastFinal, '- text:', lastTranscript);

        let sessionTranscript = '';
        let sessionInterim = '';

        if (isLastFinal) {
          sessionTranscript = lastTranscript.trim();
        } else {
          sessionInterim = lastTranscript.trim();
        }

        // ✅ FILTRE ANTI-DUPLICATION AU NIVEAU DES MOTS (sécurité)
        if (sessionTranscript) {
          const words = sessionTranscript.split(/\s+/);
          const cleanedWords: string[] = [];

          for (const word of words) {
            const lastWord = cleanedWords[cleanedWords.length - 1];
            if (word !== lastWord) {
              cleanedWords.push(word);
            } else {
              console.log('[VoiceRecorder] Removed duplicate word:', word);
            }
          }

          sessionTranscript = cleanedWords.join(' ');
          console.log('[VoiceRecorder] Session cleaned transcript:', sessionTranscript);
        }

        // ✅ COMBINER baseText + sessionTranscript
        const baseText = baseTextRef.current.trim();
        const combined = baseText && sessionTranscript
          ? baseText + ' ' + sessionTranscript
          : baseText || sessionTranscript;

        const combinedInterim = baseText && sessionInterim
          ? baseText + ' ' + sessionInterim
          : baseText || sessionInterim;

        console.log('[VoiceRecorder] baseText:', baseText);
        console.log('[VoiceRecorder] sessionTranscript:', sessionTranscript);
        console.log('[VoiceRecorder] combined:', combined);

        // ✅ Mettre à jour l'affichage ET propager au parent
        if (sessionTranscript) {
          setTranscript(combined);
          setInterimTranscript('');
          console.log('[VoiceRecorder] Calling onChange with:', combined);
          onChange(combined);  // Propager au parent immédiatement
        } else if (sessionInterim) {
          // Pour l'interim, on affiche mais ne propage pas encore
          setTranscript(baseText);
          setInterimTranscript(combinedInterim);
        }

        console.log('[VoiceRecorder] ========================================');
      };

      recognition.onerror = (event: any) => {
        console.error('[VoiceRecorder] onerror - Error type:', event.error);
        console.log('[VoiceRecorder] onerror - States:', {
          isListening: isListeningRef.current,
          isPaused: isPausedRef.current,
          isActive: isRecognitionActiveRef.current
        });

        isRecognitionActiveRef.current = false;

        if (event.error === 'no-speech') {
          console.log('[VoiceRecorder] No speech detected, continuing...');
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
        isListeningRef.current = false;
        isPausedRef.current = false;
      };

      recognition.onend = () => {
        console.log('[VoiceRecorder] onend - Recognition ended');
        const currentIsListening = isListeningRef.current;
        const currentIsPaused = isPausedRef.current;
        const currentIsRestarting = isRestartingRef.current;

        console.log('[VoiceRecorder] onend - States:', {
          isListening: currentIsListening,
          isPaused: currentIsPaused,
          isRestarting: currentIsRestarting,
          isActive: isRecognitionActiveRef.current
        });

        isRecognitionActiveRef.current = false;

        if (currentIsListening && !currentIsPaused && !currentIsRestarting) {
          console.log('[VoiceRecorder] onend - Scheduling restart in 100ms');
          isRestartingRef.current = true;

          setTimeout(() => {
            console.log('[VoiceRecorder] onend - Restart timeout fired');
            console.log('[VoiceRecorder] onend - Current states:', {
              isListening: isListeningRef.current,
              isPaused: isPausedRef.current,
              isActive: isRecognitionActiveRef.current
            });

            if (isListeningRef.current && !isPausedRef.current && !isRecognitionActiveRef.current) {
              try {
                console.log('[VoiceRecorder] onend - Attempting restart...');
                recognition.start();
                console.log('[VoiceRecorder] onend - Restart successful');
              } catch (error) {
                console.error('[VoiceRecorder] onend - Failed to restart:', error);
                setIsListening(false);
                isListeningRef.current = false;
                setErrorMessage('Impossible de redémarrer la reconnaissance vocale.');
              }
            } else {
              console.log('[VoiceRecorder] onend - Restart aborted (conditions not met)');
            }
            isRestartingRef.current = false;
          }, 100);
        } else {
          console.log('[VoiceRecorder] onend - No restart needed');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    console.log('[VoiceRecorder] startListening called');
    console.log('[VoiceRecorder] startListening - Current states:', {
      isListening: isListeningRef.current,
      isPaused: isPausedRef.current,
      isActive: isRecognitionActiveRef.current,
      hasRecognition: !!recognitionRef.current
    });

    if (recognitionRef.current && !isListening && !isRecognitionActiveRef.current) {
      console.log('[VoiceRecorder] startListening - Initializing...');

      // ✅ Utiliser la VRAIE valeur du champ parent comme baseText
      const currentText = value.trim();
      baseTextRef.current = currentText;
      console.log('[VoiceRecorder] startListening - baseText set to:', currentText);
      console.log('[VoiceRecorder] startListening - This is the REAL parent value');

      setInterimTranscript('');
      setIsValidated(false);
      setIsEditing(false);
      setErrorMessage('');
      isRestartingRef.current = false;

      try {
        console.log('[VoiceRecorder] startListening - Calling recognition.start()...');
        recognitionRef.current.start();
        console.log('[VoiceRecorder] startListening - recognition.start() called successfully');

        setIsListening(true);
        isListeningRef.current = true;
        setIsPaused(false);
        isPausedRef.current = false;
      } catch (error: any) {
        console.error('[VoiceRecorder] startListening - Error:', error);
        console.error('[VoiceRecorder] startListening - Error name:', error?.name);
        console.error('[VoiceRecorder] startListening - Error message:', error?.message);

        isListeningRef.current = false;
        isRecognitionActiveRef.current = false;

        if (error?.name === 'InvalidStateError') {
          setErrorMessage('La reconnaissance vocale est déjà en cours. Veuillez attendre.');
        } else {
          setErrorMessage('Impossible de démarrer la reconnaissance vocale. Assurez-vous d\'être en HTTPS sur mobile.');
        }
      }
    } else {
      console.log('[VoiceRecorder] startListening - Conditions not met, aborting');
      if (isListening) console.log('[VoiceRecorder] startListening - Already listening');
      if (isRecognitionActiveRef.current) console.log('[VoiceRecorder] startListening - Recognition already active');
      if (!recognitionRef.current) console.log('[VoiceRecorder] startListening - No recognition instance');
    }
  };

  const pauseListening = () => {
    console.log('[VoiceRecorder] pauseListening called');
    if (recognitionRef.current && isListening) {
      isRestartingRef.current = false;
      recognitionRef.current.stop();
      setIsPaused(true);
      isPausedRef.current = true;
      console.log('[VoiceRecorder] pauseListening - Paused');
    }
  };

  const resumeListening = () => {
    console.log('[VoiceRecorder] resumeListening called');
    if (recognitionRef.current && isPaused && !isRecognitionActiveRef.current) {
      isRestartingRef.current = false;
      try {
        console.log('[VoiceRecorder] resumeListening - Calling recognition.start()...');
        recognitionRef.current.start();
        setIsPaused(false);
        isPausedRef.current = false;
        console.log('[VoiceRecorder] resumeListening - Resumed');
      } catch (error) {
        console.error('[VoiceRecorder] resumeListening - Error:', error);
        setErrorMessage('Impossible de reprendre la reconnaissance vocale.');
      }
    }
  };

  const stopListening = () => {
    console.log('[VoiceRecorder] stopListening called');
    if (recognitionRef.current) {
      isRestartingRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      isListeningRef.current = false;
      setIsPaused(false);
      isPausedRef.current = false;
      isRecognitionActiveRef.current = false;
      setInterimTranscript('');
      console.log('[VoiceRecorder] stopListening - Stopped');
    }
  };

  const handleValidate = () => {
    const finalText = transcript.trim();
    if (finalText) {
      onChange(finalText);
      setIsValidated(true);
      setIsEditing(false);
      stopListening();
    }
  };

  const handleReset = () => {
    console.log('[VoiceRecorder] handleReset - Clearing everything');
    setTranscript('');
    setInterimTranscript('');
    setIsValidated(false);
    setIsEditing(false);
    baseTextRef.current = '';
    if (isListening) {
      stopListening();
    }
    onChange('');
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsValidated(false);
  };

  const handleSaveEdit = () => {
    const finalText = transcript.trim();
    if (finalText) {
      onChange(finalText);
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
