import { describe, expect, it } from 'vitest';
import {
  analyzeReviewTopics,
  classifyOverallSentiment,
  computeContentHash,
  shouldFlagReview,
} from '../services/topicAnalyzer';

describe('topicAnalyzer — rule-based topic tagging & sentiment engine', () => {
  it('classifies overall review sentiment on the 1.0 - 10.0 Booking.com scale', () => {
    expect(classifyOverallSentiment(9.2)).toBe('positive');
    expect(classifyOverallSentiment(8.0)).toBe('positive');
    expect(classifyOverallSentiment(7.9)).toBe('neutral');
    expect(classifyOverallSentiment(6.0)).toBe('neutral');
    expect(classifyOverallSentiment(5.9)).toBe('negative');
    expect(classifyOverallSentiment(3.5)).toBe('negative');
  });

  it('detects multiple topics and assigns separate positive and negative topic sentiments in a mixed review', () => {
    const detected = analyzeReviewTopics({
      score: 7.4,
      title: 'Friendly staff, but terrible wifi and noisy street',
      positiveComment:
        'The staff at reception were super friendly and helpful, and the room was spotless.',
      negativeComment:
        'Unfortunately the wifi was slow and kept disconnecting, and street noise kept us awake.',
    });

    const byTopic = new Map(detected.map((d) => [d.topic, d]));

    expect(byTopic.get('staff')?.sentiment).toBe('positive');
    expect(byTopic.get('cleanliness')?.sentiment).toBe('positive');
    expect(byTopic.get('wifi')?.sentiment).toBe('negative');
    expect(byTopic.get('noise')?.sentiment).toBe('negative');
  });

  it('handles negation inversion accurately (e.g., "not clean", "no street noise")', () => {
    const negatedClean = analyzeReviewTopics({
      score: 4.8,
      fullText: 'The bathroom was not clean and the receptionist was not helpful at all.',
    });
    const map1 = new Map(negatedClean.map((d) => [d.topic, d]));
    expect(map1.get('cleanliness')?.sentiment).toBe('negative');
    expect(map1.get('staff')?.sentiment).toBe('negative');

    const negatedNoise = analyzeReviewTopics({
      score: 9.0,
      fullText: 'Our room was soundproofed with no street noise at all.',
    });
    const map2 = new Map(negatedNoise.map((d) => [d.topic, d]));
    expect(map2.get('noise')?.sentiment).toBe('positive');
  });

  it('splits contrast clauses on "but" / "however" when only fullText is provided', () => {
    const topics = analyzeReviewTopics({
      score: 7.0,
      fullText: 'Delicious breakfast with fresh croissants, however the bed was uncomfortable and cramped.',
    });
    const byTopic = new Map(topics.map((d) => [d.topic, d]));

    expect(byTopic.get('breakfast')?.sentiment).toBe('positive');
    expect(byTopic.get('room_comfort')?.sentiment).toBe('negative');
  });

  it('computes a deterministic SHA-256 content hash normalized for case and whitespace', () => {
    const hashA = computeContentHash({
      propertyId: '123e4567-e89b-12d3-a456-426614174000',
      reviewerName: 'Emma B.',
      reviewDate: '2026-05-10',
      score: 8.5,
      fullText: 'Great location   and friendly staff!',
    });

    const hashB = computeContentHash({
      propertyId: '123e4567-e89b-12d3-a456-426614174000',
      reviewerName: '  emma b. ',
      reviewDate: '2026-05-10',
      score: 8.5,
      fullText: 'great location and friendly staff!',
    });

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64);
  });

  it('flags low-scoring reviews that mention operational topics', () => {
    const topics = analyzeReviewTopics({
      score: 5.2,
      fullText: 'Dirty carpet and rude front desk staff.',
    });
    expect(shouldFlagReview(5.2, topics)).toBe(true);

    const happyTopics = analyzeReviewTopics({
      score: 9.4,
      fullText: 'Spotless room and amazing breakfast.',
    });
    expect(shouldFlagReview(9.4, happyTopics)).toBe(false);
  });
});
