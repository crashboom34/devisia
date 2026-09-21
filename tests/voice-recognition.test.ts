import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  RecognitionLifecycle,
  deduplicateChunk,
  processRecognitionEvent,
  type RecognitionErrorEventLike,
  type RecognitionEventLike,
  type RecognitionFailure,
  type RecognitionStatus,
  type RecognitionResultLike,
  type SpeechRecognitionLike,
} from '../lib/voice/recognition-lifecycle';

class FakeRecognition implements SpeechRecognitionLike {
  continuous = false;
  interimResults = false;
  lang = '';
  onstart: (() => void) | null = null;
  onresult: ((event: RecognitionEventLike) => void) | null = null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null = null;
  onend: (() => void) | null = null;
  startCalls = 0;
  stopCalls = 0;
  abortCalls = 0;
  startError: Error | null = null;

  start(): void {
    this.startCalls += 1;
    if (this.startError) throw this.startError;
  }

  stop(): void {
    this.stopCalls += 1;
  }

  abort(): void {
    this.abortCalls += 1;
  }

  emitStart(): void {
    this.onstart?.();
  }

  emitEnd(): void {
    this.onend?.();
  }

  emitError(error: string): void {
    this.onerror?.({ error });
  }
}

function recognitionResult(text: string, isFinal: boolean): RecognitionResultLike {
  return {
    0: { transcript: text },
    isFinal,
    length: 1,
  };
}

function recognitionEvent(results: RecognitionResultLike[], resultIndex = 0): RecognitionEventLike {
  return { resultIndex, results };
}

function setupLifecycle(recognition = new FakeRecognition()) {
  const failures: RecognitionFailure[] = [];
  const statuses: RecognitionStatus[] = [];
  const onResult = vi.fn();
  const onSessionStart = vi.fn();
  const lifecycle = new RecognitionLifecycle(recognition, {
    onError: (failure) => failures.push(failure),
    onResult,
    onSessionStart,
    onStatusChange: (status) => statuses.push(status),
  });

  return { failures, lifecycle, onResult, onSessionStart, recognition, statuses };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('deduplicateChunk', () => {
  it('drops an identical result delivered twice', () => {
    expect(deduplicateChunk('rénover la cuisine', 'rénover la cuisine')).toBe('');
  });

  it('removes consecutive duplicated words inside a result', () => {
    expect(deduplicateChunk('je je voudrais un un devis', '')).toBe('je voudrais un devis');
  });

  it('removes a repeated overlap of three or more words', () => {
    expect(deduplicateChunk('pour rénover la cuisine avec un îlot', 'un devis pour rénover la cuisine'))
      .toBe('avec un îlot');
  });

  it('preserves short repetitions that may be intentional', () => {
    expect(deduplicateChunk('de bain moderne', 'salle de bain')).toBe('de bain moderne');
  });
});

describe('processRecognitionEvent', () => {
  it('keeps interim text separate from the final transcript', () => {
    const processed = processRecognitionEvent(
      recognitionEvent([recognitionResult('une cuisine moderne', false)]),
      new Set(),
      '',
    );

    expect(processed).toEqual({
      finalText: '',
      interimText: 'une cuisine moderne',
      lastFinalChunk: '',
    });
  });

  it('does not append the same final browser result twice', () => {
    const processedResults = new Set<string>();
    const event = recognitionEvent([recognitionResult('une cuisine moderne', true)]);

    const first = processRecognitionEvent(event, processedResults, '');
    const repeated = processRecognitionEvent(event, processedResults, first.lastFinalChunk);

    expect(first.finalText).toBe('une cuisine moderne');
    expect(repeated.finalText).toBe('');
  });

  it('honors resultIndex when the browser returns cumulative results', () => {
    const event = recognitionEvent([
      recognitionResult('premier segment', true),
      recognitionResult('second segment', true),
    ], 1);

    const processed = processRecognitionEvent(event, new Set(), '');

    expect(processed.finalText).toBe('second segment');
  });

  it('removes overlap between consecutive final chunks', () => {
    const processed = processRecognitionEvent(
      recognitionEvent([recognitionResult('pour rénover la cuisine avec un îlot', true)]),
      new Set(),
      'un devis pour rénover la cuisine',
    );

    expect(processed.finalText).toBe('avec un îlot');
  });
});

describe('RecognitionLifecycle', () => {
  it('starts, pauses and resumes without restarting while paused', () => {
    vi.useFakeTimers();
    const { lifecycle, recognition, statuses } = setupLifecycle();

    expect(lifecycle.start()).toBe(true);
    recognition.emitStart();
    lifecycle.pause();
    recognition.emitEnd();
    vi.runAllTimers();

    expect(recognition.startCalls).toBe(1);
    expect(recognition.stopCalls).toBe(1);
    expect(statuses.at(-1)).toEqual({ isListening: true, isPaused: true });

    expect(lifecycle.resume()).toBe(true);
    expect(recognition.startCalls).toBe(2);
    expect(statuses.at(-1)).toEqual({ isListening: true, isPaused: false });
  });

  it('restarts once when the browser ends an active listening session', () => {
    vi.useFakeTimers();
    const { lifecycle, recognition } = setupLifecycle();

    lifecycle.start();
    recognition.emitStart();
    recognition.emitEnd();
    recognition.emitEnd();
    vi.advanceTimersByTime(250);

    expect(recognition.startCalls).toBe(2);
  });

  it('cancels a queued restart when the user stops', () => {
    vi.useFakeTimers();
    const { lifecycle, recognition, statuses } = setupLifecycle();

    lifecycle.start();
    recognition.emitStart();
    recognition.emitEnd();
    lifecycle.stop();
    vi.runAllTimers();

    expect(recognition.startCalls).toBe(1);
    expect(statuses.at(-1)).toEqual({ isListening: false, isPaused: false });
  });

  it('cancels restarts and detaches callbacks when destroyed', () => {
    vi.useFakeTimers();
    const { lifecycle, recognition } = setupLifecycle();

    lifecycle.start();
    recognition.emitStart();
    recognition.emitEnd();
    lifecycle.destroy();
    vi.runAllTimers();

    expect(recognition.startCalls).toBe(1);
    expect(recognition.abortCalls).toBe(1);
    expect(recognition.onstart).toBeNull();
    expect(recognition.onresult).toBeNull();
    expect(recognition.onerror).toBeNull();
    expect(recognition.onend).toBeNull();
  });

  it('reports a network failure and stops the session', () => {
    const { failures, lifecycle, recognition, statuses } = setupLifecycle();

    lifecycle.start();
    recognition.emitStart();
    recognition.emitError('network');

    expect(failures).toEqual(['network']);
    expect(statuses.at(-1)).toEqual({ isListening: false, isPaused: false });
  });

  it('keeps listening after a no-speech event and restarts on end', () => {
    vi.useFakeTimers();
    const { failures, lifecycle, recognition } = setupLifecycle();

    lifecycle.start();
    recognition.emitStart();
    recognition.emitError('no-speech');
    recognition.emitEnd();
    vi.advanceTimersByTime(250);

    expect(failures).toEqual([]);
    expect(recognition.startCalls).toBe(2);
  });

  it('distinguishes an already-active start failure', () => {
    const recognition = new FakeRecognition();
    recognition.startError = new DOMException('Already started', 'InvalidStateError');
    const { failures, lifecycle, statuses } = setupLifecycle(recognition);

    expect(lifecycle.start()).toBe(false);

    expect(failures).toEqual(['start-invalid-state']);
    expect(statuses.at(-1)).toEqual({ isListening: false, isPaused: false });
  });

  it('reports unknown browser errors without exposing raw technical details', () => {
    const { failures, lifecycle, recognition } = setupLifecycle();

    lifecycle.start();
    recognition.emitError('vendor-private-error');

    expect(failures).toEqual(['unknown']);
  });
});
