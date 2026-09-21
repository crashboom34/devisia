export interface RecognitionAlternativeLike {
  transcript: string;
}

export interface RecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: RecognitionAlternativeLike;
}

export interface RecognitionEventLike {
  readonly resultIndex?: number;
  readonly results: {
    readonly length: number;
    [index: number]: RecognitionResultLike;
  };
}

export interface RecognitionErrorEventLike {
  readonly error: string;
}

export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort?(): void;
}

export type RecognitionFailure =
  | 'audio-capture'
  | 'language-not-supported'
  | 'network'
  | 'not-allowed'
  | 'restart-failed'
  | 'resume-failed'
  | 'service-not-allowed'
  | 'start-failed'
  | 'start-invalid-state'
  | 'unknown';

export interface RecognitionStatus {
  isListening: boolean;
  isPaused: boolean;
}

interface RecognitionLifecycleCallbacks {
  onError: (failure: RecognitionFailure) => void;
  onResult: (event: RecognitionEventLike) => void;
  onSessionStart?: () => void;
  onStatusChange: (status: RecognitionStatus) => void;
}

interface RecognitionLifecycleOptions {
  restartDelayMs?: number;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
}

export function deduplicateChunk(newChunk: string, previousChunk: string): string {
  const normalizedChunk = newChunk.trim();
  const normalizedPrevious = previousChunk.trim();

  if (!normalizedChunk) return '';

  const newWords = normalizedChunk.split(/\s+/);
  const cleanedWords = newWords.filter((word, index) => {
    if (index === 0) return true;
    return word.localeCompare(newWords[index - 1], 'fr', { sensitivity: 'accent' }) !== 0;
  });
  const cleanedChunk = cleanedWords.join(' ');

  if (!normalizedPrevious) return cleanedChunk;
  if (cleanedChunk.localeCompare(normalizedPrevious, 'fr', { sensitivity: 'accent' }) === 0) return '';

  const previousWords = normalizedPrevious.split(/\s+/);
  const maximumOverlap = Math.min(previousWords.length, cleanedWords.length);
  for (let size = maximumOverlap; size >= 3; size -= 1) {
    const previousTail = previousWords.slice(-size).join(' ').toLocaleLowerCase('fr');
    const newHead = cleanedWords.slice(0, size).join(' ').toLocaleLowerCase('fr');
    if (previousTail === newHead) return cleanedWords.slice(size).join(' ');
  }

  return cleanedChunk;
}

export interface ProcessedRecognitionEvent {
  finalText: string;
  interimText: string;
  lastFinalChunk: string;
}

export function processRecognitionEvent(
  event: RecognitionEventLike,
  processedFinalResults: Set<string>,
  previousFinalChunk: string,
): ProcessedRecognitionEvent {
  const finalChunks: string[] = [];
  let interimText = '';
  let lastFinalChunk = previousFinalChunk;

  const firstChangedResult = event.resultIndex ?? 0;
  for (let index = firstChangedResult; index < event.results.length; index += 1) {
    const result = event.results[index];
    const text = result[0]?.transcript.trim() ?? '';
    if (!text) continue;

    if (!result.isFinal) {
      interimText = text;
      continue;
    }

    const resultKey = `${index}:${text}`;
    if (processedFinalResults.has(resultKey)) continue;
    processedFinalResults.add(resultKey);

    const deduplicated = deduplicateChunk(text, lastFinalChunk);
    if (!deduplicated) continue;

    finalChunks.push(deduplicated);
    lastFinalChunk = deduplicated;
  }

  return {
    finalText: finalChunks.join(' '),
    interimText,
    lastFinalChunk,
  };
}

export class RecognitionLifecycle {
  private active = false;
  private destroyed = false;
  private listening = false;
  private paused = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly clearTimeoutFn: typeof clearTimeout;
  private readonly restartDelayMs: number;
  private readonly setTimeoutFn: typeof setTimeout;

  constructor(
    private readonly recognition: SpeechRecognitionLike,
    private readonly callbacks: RecognitionLifecycleCallbacks,
    options: RecognitionLifecycleOptions = {},
  ) {
    this.restartDelayMs = options.restartDelayMs ?? 250;
    this.setTimeoutFn = options.setTimeoutFn ?? setTimeout;
    this.clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;

    recognition.onstart = this.handleStart;
    recognition.onresult = callbacks.onResult;
    recognition.onerror = this.handleError;
    recognition.onend = this.handleEnd;
  }

  start(): boolean {
    if (this.destroyed || this.listening || this.active) return false;

    this.clearRestart();
    try {
      this.recognition.start();
      this.listening = true;
      this.paused = false;
      this.emitStatus();
      return true;
    } catch (error) {
      this.active = false;
      this.listening = false;
      this.paused = false;
      this.emitStatus();
      this.callbacks.onError(
        error instanceof DOMException && error.name === 'InvalidStateError'
          ? 'start-invalid-state'
          : 'start-failed',
      );
      return false;
    }
  }

  pause(): void {
    if (this.destroyed || !this.listening || this.paused) return;

    this.clearRestart();
    this.paused = true;
    this.emitStatus();
    try {
      this.recognition.stop();
    } catch {
      this.active = false;
    }
  }

  resume(): boolean {
    if (this.destroyed || !this.listening || !this.paused || this.active) return false;

    this.clearRestart();
    try {
      this.recognition.start();
      this.paused = false;
      this.emitStatus();
      return true;
    } catch {
      this.callbacks.onError('resume-failed');
      return false;
    }
  }

  stop(): void {
    if (this.destroyed) return;

    this.clearRestart();
    this.listening = false;
    this.paused = false;
    this.emitStatus();
    try {
      this.recognition.stop();
    } catch {
      this.active = false;
    }
  }

  destroy(): void {
    if (this.destroyed) return;

    this.destroyed = true;
    this.listening = false;
    this.paused = false;
    this.clearRestart();
    this.recognition.onstart = null;
    this.recognition.onresult = null;
    this.recognition.onerror = null;
    this.recognition.onend = null;

    try {
      if (this.recognition.abort) this.recognition.abort();
      else this.recognition.stop();
    } catch {
      // The browser may already have ended the recognition session.
    }
  }

  private readonly handleStart = () => {
    if (this.destroyed) return;
    this.active = true;
    this.callbacks.onSessionStart?.();
  };

  private readonly handleEnd = () => {
    this.active = false;
    if (this.destroyed || !this.listening || this.paused || this.restartTimer) return;

    this.restartTimer = this.setTimeoutFn(() => {
      this.restartTimer = null;
      if (this.destroyed || !this.listening || this.paused || this.active) return;

      try {
        this.recognition.start();
      } catch {
        this.listening = false;
        this.paused = false;
        this.emitStatus();
        this.callbacks.onError('restart-failed');
      }
    }, this.restartDelayMs);
  };

  private readonly handleError = (event: RecognitionErrorEventLike) => {
    this.active = false;
    if (this.destroyed || event.error === 'no-speech' || event.error === 'aborted') return;

    this.listening = false;
    this.paused = false;
    this.clearRestart();
    this.emitStatus();

    const knownFailures: RecognitionFailure[] = [
      'audio-capture',
      'language-not-supported',
      'network',
      'not-allowed',
      'service-not-allowed',
    ];
    const failure = event.error === 'permission-denied'
      ? 'not-allowed'
      : knownFailures.includes(event.error as RecognitionFailure)
        ? event.error as RecognitionFailure
        : 'unknown';
    this.callbacks.onError(failure);
  };

  private emitStatus(): void {
    if (this.destroyed) return;
    this.callbacks.onStatusChange({ isListening: this.listening, isPaused: this.paused });
  }

  private clearRestart(): void {
    if (!this.restartTimer) return;
    this.clearTimeoutFn(this.restartTimer);
    this.restartTimer = null;
  }
}
