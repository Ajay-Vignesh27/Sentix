/**
 * Unit Tests for opinionX Sentiment Analysis Engine
 */

const { analyzeComment, tokenize } = require('../sentiment');

describe('opinionX Sentiment Lexicon Engine', () => {
  
  test('tokenize() should clean and lowercase strings', () => {
    const text = 'Excellent, product! Works perfectly...';
    const tokens = tokenize(text);
    expect(tokens).toEqual(['excellent', 'product', 'works', 'perfectly']);
  });

  test('tokenize() should handle empty inputs gracefully', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize(null)).toEqual([]);
  });

  test('analyzeComment() should accurately classify positive feedback', () => {
    const comment = 'The onboarding experience was smooth and intuitive.';
    const result = analyzeComment(comment);
    
    expect(result.sentiment).toBe('Positive');
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.matchedPositive).toContain('smooth');
    expect(result.matchedPositive).toContain('intuitive');
    expect(result.matchedNegative).toHaveLength(0);
  });

  test('analyzeComment() should accurately classify negative feedback', () => {
    const comment = "I've been waiting 3 weeks for a refund — terrible service.";
    const result = analyzeComment(comment);
    
    expect(result.sentiment).toBe('Negative');
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.matchedNegative).toContain('waiting');
    expect(result.matchedNegative).toContain('refund');
    expect(result.matchedNegative).toContain('terrible');
  });

  test('analyzeComment() should accurately classify neutral feedback', () => {
    const comment = 'The app works fine, nothing really stands out.';
    const result = analyzeComment(comment);
    
    expect(result.sentiment).toBe('Neutral');
    expect(result.confidence).toBeGreaterThanOrEqual(70);
    expect(result.matchedPositive).toContain('fine'); // weak positive
    expect(result.matchedNegative).toHaveLength(0);
  });

  test('analyzeComment() should flip polarity with negation contexts', () => {
    // "not terrible" should not be classified as strongly negative
    const result1 = analyzeComment('The layout is not terrible.');
    expect(result1.sentiment).not.toBe('Negative');

    // "not smooth" should not be positive
    const result2 = analyzeComment('The animations are not smooth.');
    expect(result2.sentiment).toBe('Negative');
  });

  test('analyzeComment() should handle empty text gracefully', () => {
    const result = analyzeComment('   ');
    expect(result.sentiment).toBe('Neutral');
    expect(result.confidence).toBe(70);
    expect(result.reason).toContain('Empty text');
  });

  test('analyzeComment() should output structured explanations', () => {
    const result = analyzeComment('Absolutely love this dashboard redesign!');
    expect(result.reason).toContain('Identified positive indicators');
    expect(result.reason).toContain('love');
    expect(result.reason).toContain('redesign');
  });
});
