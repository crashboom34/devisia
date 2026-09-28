import { describe, expect, it } from 'vitest';
import { applyAnswers, buildRefinedDescription, fallbackQuestions, normalizeQuestions, type RefinementState } from '../supabase/functions/_shared/btp-refinement';

const state = (): RefinementState => ({
  project_id: 'project', version: 1, status: 'REFINEMENT', facts: [],
  questions: fallbackQuestions('Toiture terrasse avec poteaux et façade', []),
});

describe('project refinement contract', () => {
  it('asks at most three ranked questions and rejects repeated model questions', () => {
    const existing = state().questions;
    const generated = normalizeQuestions([
      ...existing, { id: 'finitions', module: 'btp-quote-auditor', impact: 'FINISH', text: 'Quelle finition souhaitez-vous retenir ?', affectedLots: ['Placo'] },
      { id: 'structure', module: 'construction-risk', impact: 'BLOCKING', text: 'Où reposeront les nouvelles fondations ?', affectedLots: ['Structure'] },
      { id: 'structure', module: 'construction-risk', impact: 'BLOCKING', text: 'Une question répétée sur la structure ?', affectedLots: [] },
      { id: 'invalid', module: 'invented-module', impact: 'BLOCKING', text: 'Une question venant d’un module inconnu ?', affectedLots: [] },
    ], existing);
    expect(generated.map(q => q.id)).toEqual(['structure', 'finitions']);
  });

  it('records a missing answer once and carries confirmed answers into the pricing brief', () => {
    const initial = state();
    const [first, second] = initial.questions;
    const updated = applyAnswers(initial, [
      { id: first.id, value: 'Je ne sais pas' },
      { id: second.id, value: 'Deux descentes existantes côté jardin' },
    ]);
    expect(updated.version).toBe(2);
    expect(updated.facts.map(f => f.status)).toEqual(['MISSING', 'KNOWN']);
    expect(updated.questions.slice(0, 2).map(q => q.status)).toEqual(['ANSWERED', 'ANSWERED']);
    const brief = buildRefinedDescription('Toiture existante', updated);
    expect(brief).toContain('Deux descentes existantes côté jardin');
    expect(brief).toContain('installation de chantier');
    expect(initial.questions[0].status).toBe('OPEN');
    expect(() => applyAnswers(updated, [{ id: first.id, value: 'Autre réponse' }])).toThrow();
  });

  it('continues without resurfacing fallback questions already asked', () => {
    const initial = state();
    const next = fallbackQuestions('Toiture terrasse avec poteaux et façade', initial.questions);
    expect(next.some(q => initial.questions.some(old => old.id === q.id))).toBe(false);
  });
});
