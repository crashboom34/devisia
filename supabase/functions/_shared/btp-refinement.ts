/** Contract shared by the web client, the refinement function and its tests. */
export const BTP_SPECIALISTS = [
  { id: 'btp-takeoff', role: 'Métrés, dimensions et contradictions de quantités' },
  { id: 'btp-cost-engineer-fr', role: 'Déboursé, coût de main-d’œuvre et hypothèses de prix' },
  { id: 'supplier-price-check', role: 'Prix datés, gamme de fournitures et livraison' },
  { id: 'btp-purchasing', role: 'Conditionnements, accès et approvisionnements' },
  { id: 'btp-planning', role: 'Phasage, délais et contraintes d’occupation' },
  { id: 'construction-risk', role: 'Existant, sol, réseaux et risques de reprise' },
  { id: 'building-regulation', role: 'Destination, études, autorisations et TVA à vérifier' },
  { id: 'historical-cost-learning', role: 'Comparabilité avec les chantiers réellement réalisés' },
  { id: 'btp-quote-auditor', role: 'Omissions, doubles comptes et limites de prestation' },
  { id: 'btp-quote-architect', role: 'Présentation commerciale, inclusions et options' },
] as const;

export type SpecialistId = typeof BTP_SPECIALISTS[number]['id'];
export type Impact = 'BLOCKING' | 'HIGH' | 'FINISH';
export type FactStatus = 'KNOWN' | 'ASSUMED' | 'MISSING';
export type Scope = 'BASE' | 'OPTION' | 'EXCLUDED' | 'OWNER_DIRECT' | 'UNDECIDED';

export interface RefinementQuestion {
  id: string;
  module: SpecialistId;
  text: string;
  why: string;
  impact: Impact;
  affectedLots: string[];
  answer?: string;
  status: 'OPEN' | 'ANSWERED';
}

export interface RefinementFact {
  key: string;
  value: string;
  status: FactStatus;
  scope: Scope;
  source: 'user' | 'brief' | 'assumption';
  revision: number;
}

export interface RefinementState {
  project_id: string;
  version: number;
  status: 'DISCOVERY' | 'REFINEMENT' | 'ESTIMATE';
  facts: RefinementFact[];
  questions: RefinementQuestion[];
  updated_at?: string;
}

export interface AnswerInput { id: string; value: string }

export const COMMERCIAL_PREFERENCES =
  'Ne crée pas de lignes commerciales autonomes « installation de chantier » ou « nettoyage » : répartir ces coûts dans les ouvrages concernés. Les plans d’architecte et le dépôt des autorisations restent hors mission, sauf demande explicite. Distinguer la mission éventuelle du bureau d’études structure.';

const specialistIds = new Set<string>(BTP_SPECIALISTS.map((module) => module.id));
const impactOrder: Record<Impact, number> = { BLOCKING: 0, HIGH: 1, FINISH: 2 };

export function normalizeQuestions(raw: unknown, previous: RefinementQuestion[]): RefinementQuestion[] {
  if (!Array.isArray(raw)) return [];
  const known = new Set(previous.map((q) => q.id));
  const knownTexts = new Set(previous.map((q) => q.text.trim().toLocaleLowerCase('fr-FR')));
  const accepted: RefinementQuestion[] = [];
  for (const item of raw.slice(0, 15)) {
    if (!item || typeof item !== 'object') continue;
    const q = item as Record<string, unknown>;
    const id = typeof q.id === 'string' ? q.id.trim() : '';
    const module = typeof q.module === 'string' ? q.module : '';
    const text = typeof q.text === 'string' ? q.text.trim() : '';
    const normalizedText = text.toLocaleLowerCase('fr-FR');
    if (!/^[a-z0-9_-]{3,64}$/.test(id) || known.has(id) || knownTexts.has(normalizedText) || !specialistIds.has(module) || text.length < 12 || text.length > 300) continue;
    const impact: Impact = q.impact === 'BLOCKING' || q.impact === 'HIGH' ? q.impact : 'FINISH';
    const affectedLots = Array.isArray(q.affectedLots)
      ? q.affectedLots.filter((v): v is string => typeof v === 'string').slice(0, 5).map((v) => v.slice(0, 60))
      : [];
    accepted.push({
      id, module: module as SpecialistId, text, impact,
      why: typeof q.why === 'string' ? q.why.slice(0, 240) : '',
      affectedLots, status: 'OPEN',
    });
    known.add(id);
    knownTexts.add(normalizedText);
  }
  return accepted.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact]).slice(0, 3);
}

export function applyAnswers(state: RefinementState, answers: AnswerInput[]): RefinementState {
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > 3) throw new Error('Répondez à une à trois questions.');
  const open = new Map(state.questions.filter((q) => q.status === 'OPEN').map((q) => [q.id, q]));
  const seen = new Set<string>();
  const facts = [...state.facts];
  const questions = state.questions.map((q) => ({ ...q }));
  for (const answer of answers) {
    if (!answer || !open.has(answer.id) || seen.has(answer.id) || typeof answer.value !== 'string') {
      throw new Error('Question inconnue ou déjà traitée. Actualisez le dossier.');
    }
    const value = answer.value.trim();
    if (!value || value.length > 2000) throw new Error('Réponse vide ou trop longue.');
    seen.add(answer.id);
    const question = questions.find((q) => q.id === answer.id)!;
    question.answer = value;
    question.status = 'ANSWERED';
    const unknown = /^(je ne sais pas|inconnu|à vérifier|a verifier)$/i.test(value);
    facts.push({
      key: answer.id, value, status: unknown ? 'MISSING' : 'KNOWN',
      scope: 'UNDECIDED', source: 'user', revision: state.version + 1,
    });
  }
  return { ...state, version: state.version + 1, status: 'REFINEMENT', facts, questions };
}

export function fallbackQuestions(brief: string, previous: RefinementQuestion[]): RefinementQuestion[] {
  const text = brief.toLocaleLowerCase('fr-FR');
  const candidates: Omit<RefinementQuestion, 'status'>[] = [];
  if (/toit|terrasse|poteau|dalle|fondation|charpente/.test(text)) {
    candidates.push({ id: 'appuis-existant', module: 'construction-risk', impact: 'BLOCKING', text: 'Que trouve-t-on sous le plancher existant et où les nouveaux appuis rejoindront-ils le sol ?', why: 'Les fondations et les reprises de charges dépendent de cet accès.', affectedLots: ['Structure'] });
    candidates.push({ id: 'evacuations-toiture', module: 'btp-takeoff', impact: 'HIGH', text: 'Où seront évacuées les eaux du toit et les descentes sont-elles à créer ?', why: 'Les évacuations et raccordements changent le périmètre.', affectedLots: ['Étanchéité'] });
  }
  if (/façade|enduit|crépi|crepi/.test(text)) {
    candidates.push({ id: 'support-facades', module: 'btp-takeoff', impact: 'HIGH', text: 'Les façades à enduire sont-elles neuves, anciennes, ou nécessitent-elles une préparation particulière ?', why: 'Le support et l’accès déterminent la méthode de pose.', affectedLots: ['Façades'] });
  }
  candidates.push({ id: 'perimetre-etudes', module: 'btp-quote-architect', impact: 'HIGH', text: 'Qui commandera et paiera les études et plans éventuellement nécessaires ?', why: 'Ces missions doivent être séparées des travaux de l’entreprise.', affectedLots: ['Études'] });
  candidates.push({ id: 'acces-chantier', module: 'btp-planning', impact: 'HIGH', text: 'L’accès au chantier permet-il la livraison et la manutention des matériaux prévus ?', why: 'L’accès peut modifier les moyens et la durée.', affectedLots: ['Logistique'] });
  return normalizeQuestions(candidates, previous);
}

export function buildRefinedDescription(description: string, state: RefinementState): string {
  const answers = state.questions.filter((q) => q.status === 'ANSWERED')
    .map((q) => `${q.text}\nRéponse : ${q.answer}`).join('\n');
  return `${description}\n\nRÉPONSES CONFIRMÉES PAR L'UTILISATEUR :\n${answers || 'Aucune.'}\n\nPOINTS ENCORE OUVERTS :\n${state.questions.filter((q) => q.status === 'OPEN').map((q) => q.text).join('\n') || 'Aucun.'}\n\nPRÉFÉRENCES DE PRÉSENTATION :\n${COMMERCIAL_PREFERENCES}`;
}
