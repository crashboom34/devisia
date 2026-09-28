import { describe, expect, it } from 'vitest';
import { collectSpeechResults } from '../lib/voice-transcript';

const result = (text: string, isFinal: boolean) => ({ 0: { transcript: text }, isFinal });

describe('dictée fragmentée', () => {
  it('ne réinsère pas les résultats finaux répétés dans les événements suivants', () => {
    const first = collectSpeechResults([result('toiture', true), result('terrasse', false)], 0);
    expect(first).toEqual({ final: 'toiture', interim: 'terrasse', processed: 1 });
    const second = collectSpeechResults([result('toiture', true), result('terrasse', true)], first.processed);
    expect(second).toEqual({ final: 'terrasse', interim: '', processed: 2 });
  });

  it('préserve les répétitions volontaires après une pause et lors d’une nouvelle session', () => {
    const first = collectSpeechResults([result('deux', true), result('deux', true)], 0);
    expect(first.final).toBe('deux deux');
    expect(collectSpeechResults([result('deux', true)], 0).final).toBe('deux');
  });

  it('n’ajoute pas une hypothèse intermédiaire au texte définitif', () => {
    expect(collectSpeechResults([result('travertin mural', false)], 0).final).toBe('');
  });
});
