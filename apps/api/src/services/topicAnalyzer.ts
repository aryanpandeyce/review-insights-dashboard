import crypto from 'crypto';
import { DetectedTopic, Sentiment, TopicName } from '../types/domain';

interface TopicRuleConfig {
  topic: TopicName;
  keywords: string[];
  inherentlyPositivePhrases: string[];
  inherentlyNegativePhrases: string[];
}

/**
 * Transparent rule-based topic dictionary and phrase polarity definitions.
 * Documented in README.md and ADR-006.
 */
const TOPIC_RULES: TopicRuleConfig[] = [
  {
    topic: 'cleanliness',
    keywords: [
      'clean',
      'cleanliness',
      'spotless',
      'immaculate',
      'tidy',
      'hygiene',
      'hygienic',
      'housekeeping',
      'dirty',
      'dust',
      'dusty',
      'stain',
      'stained',
      'stains',
      'mold',
      'mildew',
      'smell',
      'odor',
      'filthy',
      'fresh towels',
      'sheets',
    ],
    inherentlyPositivePhrases: ['spotless', 'immaculate', 'sparkling clean', 'super clean', 'very clean', 'fresh towels'],
    inherentlyNegativePhrases: ['dirty', 'dusty', 'stain', 'stained', 'stains', 'mold', 'mildew', 'bad smell', 'odor', 'filthy', 'not clean', 'poor housekeeping'],
  },
  {
    topic: 'staff',
    keywords: [
      'staff',
      'reception',
      'receptionist',
      'front desk',
      'concierge',
      'service',
      'manager',
      'host',
      'team',
      'friendly',
      'helpful',
      'welcoming',
      'attentive',
      'polite',
      'rude',
      'unhelpful',
      'dismissive',
      'arrogant',
      'check-in',
      'check in',
    ],
    inherentlyPositivePhrases: ['friendly', 'helpful', 'welcoming', 'attentive', 'polite', 'went above and beyond', 'warm welcome', 'smooth check-in'],
    inherentlyNegativePhrases: ['rude', 'unhelpful', 'dismissive', 'arrogant', 'slow check-in', 'unfriendly', 'ignored us', 'cold reception'],
  },
  {
    topic: 'location',
    keywords: [
      'location',
      'located',
      'central',
      'walking distance',
      'walkable',
      'neighborhood',
      'area',
      'metro',
      'tram',
      'station',
      'beachfront',
      'beach',
      'canal',
      'view',
      'views',
      'convenient',
      'remote',
      'isolated',
      'far from',
    ],
    inherentlyPositivePhrases: ['great location', 'perfect location', 'central', 'walking distance', 'walkable', 'stunning view', 'canal view', 'sea view', 'beachfront', 'convenient'],
    inherentlyNegativePhrases: ['far from', 'remote', 'isolated', 'bad neighborhood', 'inconvenient location', 'long walk'],
  },
  {
    topic: 'breakfast',
    keywords: [
      'breakfast',
      'buffet',
      'croissant',
      'croissants',
      'coffee',
      'espresso',
      'pastries',
      'pastry',
      'eggs',
      'juice',
      'breakfast room',
      'morning meal',
      'bacon',
      'fruit',
      'gluten-free',
      'vegan options',
    ],
    inherentlyPositivePhrases: ['delicious breakfast', 'great breakfast', 'fresh croissants', 'excellent coffee', 'huge buffet', 'amazing breakfast', 'plenty of choice'],
    inherentlyNegativePhrases: ['cold breakfast', 'stale', 'poor breakfast', 'overpriced breakfast', 'bad coffee', 'watery coffee', 'crowded breakfast', 'empty trays'],
  },
  {
    topic: 'wifi',
    keywords: [
      'wifi',
      'wi-fi',
      'internet',
      'connection',
      'signal',
      'bandwidth',
      'router',
      'video call',
      'zoom',
      'streaming',
      'online',
    ],
    inherentlyPositivePhrases: ['fast wifi', 'fast wi-fi', 'reliable wifi', 'strong signal', 'great internet', 'high speed', 'flawless wifi'],
    inherentlyNegativePhrases: ['slow wifi', 'slow wi-fi', 'weak signal', 'no wifi', 'spotty wifi', 'spotty internet', 'kept disconnecting', 'unstable internet', 'terrible wifi'],
  },
  {
    topic: 'noise',
    keywords: [
      'noise',
      'noisy',
      'quiet',
      'peaceful',
      'silent',
      'soundproof',
      'soundproofing',
      'soundproofed',
      'thin walls',
      'street noise',
      'traffic',
      'construction',
      'loud',
      'corridor',
      'hallway',
      'earplugs',
    ],
    inherentlyPositivePhrases: ['very quiet', 'super quiet', 'peaceful', 'soundproof', 'soundproofed', 'no noise', 'no street noise', 'slept like a baby', 'silent'],
    inherentlyNegativePhrases: ['noisy', 'thin walls', 'street noise', 'loud', 'construction noise', 'could hear everything', 'kept us awake', 'poor soundproofing', 'earplugs'],
  },
  {
    topic: 'value',
    keywords: [
      'value',
      'price',
      'priced',
      'pricing',
      'worth',
      'overpriced',
      'expensive',
      'affordable',
      'reasonable',
      'money',
      'bargain',
      'cost',
      'hidden fee',
      'extra charge',
    ],
    inherentlyPositivePhrases: ['great value', 'good value', 'worth every penny', 'worth the price', 'affordable', 'reasonable price', 'reasonably priced', 'fair price', 'bargain'],
    inherentlyNegativePhrases: ['overpriced', 'too expensive', 'not worth', 'poor value', 'ripoff', 'rip-off', 'hidden fee', 'extra charge', 'extortionate'],
  },
  {
    topic: 'room_comfort',
    keywords: [
      'bed',
      'beds',
      'mattress',
      'pillow',
      'pillows',
      'room size',
      'spacious',
      'cramped',
      'tiny room',
      'small room',
      'comfortable',
      'uncomfortable',
      'cozy',
      'air conditioning',
      'a/c',
      'heating',
      'shower',
      'water pressure',
      'balcony',
      'bathroom',
    ],
    inherentlyPositivePhrases: ['comfortable bed', 'comfy bed', 'spacious', 'great shower', 'strong water pressure', 'cozy', 'plush pillows', 'large room', 'good air conditioning'],
    inherentlyNegativePhrases: ['uncomfortable bed', 'hard mattress', 'lumpy pillow', 'cramped', 'tiny room', 'small room', 'weak water pressure', 'broken ac', 'no air conditioning', 'stuffy', 'cold shower'],
  },
];

const GENERAL_POSITIVE_WORDS = new Set([
  'great',
  'excellent',
  'amazing',
  'wonderful',
  'fantastic',
  'perfect',
  'lovely',
  'good',
  'nice',
  'best',
  'superb',
  'outstanding',
  'pleasant',
  'impressed',
  'clean',
  'friendly',
  'helpful',
  'quiet',
  'comfortable',
  'spacious',
  'fast',
  'fresh',
  'delicious',
  'reliable',
]);

const GENERAL_NEGATIVE_WORDS = new Set([
  'bad',
  'terrible',
  'horrible',
  'awful',
  'poor',
  'worst',
  'disappointing',
  'disappointed',
  'unacceptable',
  'dirty',
  'rude',
  'noisy',
  'loud',
  'slow',
  'broken',
  'cold',
  'cramped',
  'tiny',
  'overpriced',
  'expensive',
  'uncomfortable',
  'smelly',
  'stale',
  'weak',
  'issue',
  'problem',
  'lacking',
]);

const NEGATION_WORDS = new Set([
  'not',
  'no',
  'never',
  'neither',
  'hardly',
  'barely',
  'scarcely',
  'without',
  'lack',
  'lacked',
  'lacking',
  "wasn't",
  "weren't",
  "isn't",
  "aren't",
  "didn't",
  "doesn't",
  "don't",
  "couldn't",
  "wouldn't",
]);

/**
 * Deterministically classify overall review sentiment from its 1.0 - 10.0 score.
 * Positive: >= 8.0, Neutral: 6.0 - 7.9, Negative: < 6.0
 */
export function classifyOverallSentiment(score: number): Sentiment {
  if (score >= 8.0) return 'positive';
  if (score >= 6.0) return 'neutral';
  return 'negative';
}

/**
 * Compute deterministic SHA-256 content hash for idempotent review deduplication.
 */
export function computeContentHash(input: {
  propertyId: string;
  reviewerName: string;
  reviewDate: string;
  score: number;
  fullText: string;
}): string {
  const normalized = [
    input.propertyId.trim().toLowerCase(),
    input.reviewerName.trim().toLowerCase(),
    input.reviewDate.trim(),
    Number(input.score).toFixed(1),
    input.fullText.trim().toLowerCase().replace(/\s+/g, ' '),
  ].join('|');

  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

interface ClauseSegment {
  text: string;
  lower: string;
  sourceBias: number; // +1 for positiveComment, -1 for negativeComment, 0 for general text
}

/**
 * Split review text fields into clause segments with provenance bias.
 * Splitting on sentence punctuation AND contrast conjunctions ("but", "however", "although")
 * ensures mixed sentences like "Staff were friendly, but the wifi was terrible" score each topic accurately.
 */
function extractClauses(input: {
  title?: string | null;
  positiveComment?: string | null;
  negativeComment?: string | null;
  fullText?: string | null;
}): ClauseSegment[] {
  const segments: ClauseSegment[] = [];
  const clauseDelimiter = /[.!?;]+|\b(?:but|however|although|though|whereas|yet)\b/i;

  const pushSegments = (raw: string | null | undefined, sourceBias: number): void => {
    if (!raw) return;
    const parts = raw
      .split(clauseDelimiter)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const part of parts) {
      segments.push({
        text: part,
        lower: part.toLowerCase(),
        sourceBias,
      });
    }
  };

  if (input.positiveComment || input.negativeComment) {
    pushSegments(input.title, 0);
    pushSegments(input.positiveComment, 1.25);
    pushSegments(input.negativeComment, -1.25);
  } else {
    pushSegments(input.fullText ?? input.title, 0);
  }

  return segments;
}

/**
 * Check if a keyword appears as a whole word/phrase in a lowercase clause.
 */
function containsKeyword(clauseLower: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(clauseLower);
}

/**
 * Score the polarity of a clause containing a topic match using phrase rules,
 * general lexicon words, negation inversion, and section bias.
 */
function scoreClausePolarity(clause: ClauseSegment, rule: TopicRuleConfig): number {
  let score = clause.sourceBias;

  for (const posPhrase of rule.inherentlyPositivePhrases) {
    if (containsKeyword(clause.lower, posPhrase)) {
      // Check if preceded by a negation like "not spotless" or "not friendly"
      const negatedRegex = new RegExp(
        `\\b(?:not|never|hardly|barely|wasn't|weren't|isn't|aren't)\\s+(?:very\\s+|so\\s+|really\\s+)?${posPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );
      score += negatedRegex.test(clause.lower) ? -2.0 : 2.0;
    }
  }

  for (const negPhrase of rule.inherentlyNegativePhrases) {
    if (containsKeyword(clause.lower, negPhrase)) {
      // Check if preceded by a negation like "no noise" or "not dirty"
      const negatedRegex = new RegExp(
        `\\b(?:no|not|never|zero|without)\\s+(?:any\\s+)?${negPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'i'
      );
      score += negatedRegex.test(clause.lower) ? 1.5 : -2.0;
    }
  }

  // Token-level lexicon scan with 3-word lookbehind negation window
  const tokens = clause.lower
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    const hasNegationNearby =
      (i >= 1 && NEGATION_WORDS.has(tokens[i - 1] ?? '')) ||
      (i >= 2 && NEGATION_WORDS.has(tokens[i - 2] ?? '')) ||
      (i >= 3 && NEGATION_WORDS.has(tokens[i - 3] ?? ''));

    // Special case: for "noise", the word "noise" preceded by "no" ("no noise") is positive
    if (rule.topic === 'noise' && token === 'noise' && hasNegationNearby) {
      score += 1.5;
      continue;
    }

    if (GENERAL_POSITIVE_WORDS.has(token)) {
      score += hasNegationNearby ? -1.2 : 1.0;
    } else if (GENERAL_NEGATIVE_WORDS.has(token)) {
      score += hasNegationNearby ? 0.8 : -1.2;
    }
  }

  return score;
}

/**
 * Analyze a review's text and score to extract tagged topics, topic-specific sentiment,
 * matched keywords, and evidence snippets.
 */
export function analyzeReviewTopics(input: {
  score: number;
  title?: string | null;
  positiveComment?: string | null;
  negativeComment?: string | null;
  fullText?: string | null;
}): DetectedTopic[] {
  const clauses = extractClauses(input);
  const detected: DetectedTopic[] = [];
  const overallSentiment = classifyOverallSentiment(input.score);

  for (const rule of TOPIC_RULES) {
    const matchedKeywords = new Set<string>();
    const matchingClauses: ClauseSegment[] = [];

    for (const clause of clauses) {
      let clauseMatched = false;
      for (const kw of rule.keywords) {
        if (containsKeyword(clause.lower, kw)) {
          matchedKeywords.add(kw);
          clauseMatched = true;
        }
      }
      if (clauseMatched) {
        matchingClauses.push(clause);
      }
    }

    if (matchedKeywords.size === 0 || matchingClauses.length === 0) {
      continue;
    }

    let totalPolarity = 0;
    for (const clause of matchingClauses) {
      totalPolarity += scoreClausePolarity(clause, rule);
    }

    let topicSentiment: Sentiment;
    if (totalPolarity >= 0.75) {
      topicSentiment = 'positive';
    } else if (totalPolarity <= -0.75) {
      topicSentiment = 'negative';
    } else {
      topicSentiment = overallSentiment;
    }

    const bestSnippet = matchingClauses[0]?.text.slice(0, 180) ?? '';

    detected.push({
      topic: rule.topic,
      sentiment: topicSentiment,
      matchedKeywords: Array.from(matchedKeywords),
      snippet: bestSnippet,
    });
  }

  return detected;
}

/**
 * Determine whether a review should be flagged for management attention.
 * Flagging criteria:
 * - Low overall score (< 6.0) mentioning at least one operational topic, OR
 * - Very low overall score (<= 4.5), OR
 * - Any review <= 6.5 with 2 or more negative topic tags.
 */
export function shouldFlagReview(score: number, topics: DetectedTopic[]): boolean {
  const negativeTopicCount = topics.filter((t) => t.sentiment === 'negative').length;
  if (score <= 4.5) return true;
  if (score < 6.0 && (topics.length > 0 || negativeTopicCount > 0)) return true;
  if (score <= 6.5 && negativeTopicCount >= 2) return true;
  return false;
}
