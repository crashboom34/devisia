interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

/** A recognition session repeats its earlier final results in later events. */
export function collectSpeechResults(results: ArrayLike<RecognitionResult>, processed: number) {
  const finals: string[] = [];
  let interim = '';
  let nextProcessed = processed;
  for (let i = 0; i < results.length; i++) {
    const text = results[i][0]?.transcript?.trim();
    if (!text) continue;
    if (results[i].isFinal && i >= processed) {
      finals.push(text);
      nextProcessed = i + 1;
    } else if (!results[i].isFinal) {
      interim = text;
    }
  }
  return { final: finals.join(' '), interim, processed: nextProcessed };
}
