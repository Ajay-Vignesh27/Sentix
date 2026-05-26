/**
 * Sentix Lexicon-Based Sentiment Analysis Engine
 */

const SENTIMENT_LEXICON = {
  // Positive words
  'love': 4, 'loved': 4, 'loves': 4, 'loving': 4, 'excellent': 4, 'outstanding': 4,
  'awesome': 4, 'amazing': 4, 'wonderful': 4, 'fantastic': 4, 'beautiful': 3,
  'great': 3, 'good': 2, 'best': 3, 'superb': 3, 'perfect': 4, 'perfectly': 4,
  'smooth': 3, 'smoothly': 3, 'intuitive': 3, 'intuitively': 3, 'easy': 2, 'easily': 2,
  'friendly': 2, 'helpful': 2, 'help': 2, 'helped': 2, 'happy': 3, 'glad': 2,
  'satisfied': 3, 'satisfactory': 2, 'appreciate': 2, 'appreciated': 2, 'like': 2, 'liked': 2,
  'likes': 2, 'recommend': 3, 'recommended': 3, 'fast': 2, 'quick': 2, 'quickly': 2,
  'efficient': 3, 'efficiently': 3, 'solved': 2, 'resolves': 2, 'resolved': 2, 'redesign': 2,
  'exceeded': 3, 'exceed': 3, 'pleased': 3, 'favorite': 3, 'useful': 2, 'valuable': 3,
  'smart': 2, 'brilliant': 4, 'innovative': 3, 'clean': 2, 'nice': 2, 'nicely': 2,
  'fine': 1, 'ok': 1, 'okay': 1, 'decent': 1, 'worth': 2,

  // Negative words
  'hate': -4, 'hated': -4, 'hating': -4, 'terrible': -4, 'terribly': -4, 'awful': -4,
  'horrible': -4, 'horribly': -4, 'worst': -4, 'bad': -3, 'badly': -3, 'poor': -3,
  'poorly': -3, 'slow': -2, 'slowly': -2, 'broken': -3, 'broke': -2, 'break': -2,
  'fail': -2, 'failed': -3, 'failing': -2, 'failure': -3, 'useless': -4, 'waste': -3,
  'wasted': -3, 'frustrated': -3, 'frustrating': -3, 'annoyed': -2, 'annoying': -2,
  'disappointed': -3, 'disappointing': -3, 'disappointment': -3, 'hate': -4, 'wait': -1,
  'waiting': -2, 'waited': -1, 'delay': -2, 'delayed': -2, 'expensive': -2, 'overpriced': -2,
  'bug': -2, 'bugs': -2, 'buggy': -3, 'crash': -3, 'crashed': -3, 'crashes': -3,
  'error': -2, 'errors': -2, 'issue': -1, 'issues': -2, 'difficult': -2, 'difficulty': -2,
  'confusing': -2, 'confused': -1, 'hard': -1, 'pain': -2, 'painful': -3, 'refund': -1,
  'refunds': -1, 'ticket': 0, 'tickets': 0, 'urgent': -1, 'unhappy': -3, 'ruined': -3,
  'mess': -2, 'garbage': -3, 'trash': -3, 'clunky': -2, 'slowdown': -2, 'freeze': -2,
  'frozen': -3, 'complaint': -2, 'complaints': -2, 'complain': -2, 'ignored': -3,
  'ignore': -2, 'useless': -3, 'worst': -4, 'lacking': -2, 'lack': -1, 'missing': -1
};

const NEGATION_WORDS = [
  'not', 'no', 'never', 'don\'t', 'dont', 'cannot', 'cant', 'can\'t',
  'wasn\'t', 'wasnt', 'is\'n\'t', 'isnt', 'won\'t', 'wont', 'couldn\'t', 'couldnt',
  'wouldn\'t', 'wouldnt', 'shouldn\'t', 'shouldnt', 'haven\'t', 'havent',
  'hadn\'t', 'hadnt', 'neither', 'nor'
];

/**
 * Normalizes text: lowercases and removes punctuation.
 */
function tokenize(text) {
  if (!text) return [];
  // Standardize punctuation spacing and lowercase
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Analyzes a single comment.
 * @param {string} commentText 
 * @returns {object} Analysis result
 */
function analyzeComment(commentText) {
  if (!commentText || !commentText.trim()) {
    return {
      comment: '',
      sentiment: 'Neutral',
      confidence: 70,
      reason: 'Empty text provided.',
      matchedPositive: [],
      matchedNegative: []
    };
  }

  const tokens = tokenize(commentText);
  let totalScore = 0;
  const matchedPositive = [];
  const matchedNegative = [];
  
  let isNegated = false;
  let negationDistance = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check if current token is a negation word
    if (NEGATION_WORDS.includes(token)) {
      isNegated = true;
      negationDistance = 0;
      continue;
    }

    // If negation word was seen, keep track of distance
    if (isNegated) {
      negationDistance++;
      // Limit negation influence to 3 words
      if (negationDistance > 3) {
        isNegated = false;
      }
    }

    // Check if token exists in lexicon
    if (token in SENTIMENT_LEXICON) {
      let score = SENTIMENT_LEXICON[token];

      // If negated, invert and dampen the score
      if (isNegated) {
        score = -score * 0.75;
        isNegated = false; // Reset negation after applying to one sentiment word
      }

      totalScore += score;

      if (score > 0) {
        if (!matchedPositive.includes(token)) {
          matchedPositive.push(token);
        }
      } else if (score < 0) {
        if (!matchedNegative.includes(token)) {
          matchedNegative.push(token);
        }
      }
    }
  }

  // Determine sentiment category
  let sentiment = 'Neutral';
  if (totalScore > 0.2) {
    sentiment = 'Positive';
  } else if (totalScore < -0.2) {
    sentiment = 'Negative';
  }

  // Calculate confidence score (bounded 50% - 98%)
  let confidence = 70; // baseline
  const absScore = Math.abs(totalScore);

  if (sentiment !== 'Neutral') {
    confidence = Math.min(98, Math.round(70 + (absScore * 7)));
  } else {
    // If neutral because positive and negative words cancel each other out
    if (matchedPositive.length > 0 && matchedNegative.length > 0) {
      confidence = 55; // mixed/conflict -> lower confidence
    } else if (matchedPositive.length === 0 && matchedNegative.length === 0) {
      confidence = 75; // strictly neutral, no emotional words -> higher confidence
    } else {
      confidence = 65; // weak signal
    }
  }

  // Generate structured reason
  let reason = '';
  if (sentiment === 'Positive') {
    const wordList = matchedPositive.map(w => `'${w}'`).join(', ');
    if (matchedNegative.length > 0) {
      const negList = matchedNegative.map(w => `'${w}'`).join(', ');
      reason = `Positive overall (score +${totalScore.toFixed(1)}). Matched positive terms [${wordList}] outweighing negative terms [${negList}].`;
    } else {
      reason = `Identified positive indicators: [${wordList}]. Total score +${totalScore.toFixed(1)}.`;
    }
  } else if (sentiment === 'Negative') {
    const wordList = matchedNegative.map(w => `'${w}'`).join(', ');
    if (matchedPositive.length > 0) {
      const posList = matchedPositive.map(w => `'${w}'`).join(', ');
      reason = `Negative overall (score ${totalScore.toFixed(1)}). Matched negative terms [${wordList}] outweighing positive terms [${posList}].`;
    } else {
      reason = `Identified negative indicators: [${wordList}]. Total score ${totalScore.toFixed(1)}.`;
    }
  } else {
    if (matchedPositive.length > 0 && matchedNegative.length > 0) {
      reason = `Conflict analysis: Neutral balance. Positive indicators [${matchedPositive.map(w=>`'${w}'`).join(', ')}] canceled out by negative indicators [${matchedNegative.map(w=>`'${w}'`).join(', ')}].`;
    } else {
      reason = `Neutral analysis: No significant sentiment-bearing words detected in the comment.`;
    }
  }

  return {
    comment: commentText,
    sentiment,
    confidence,
    reason,
    matchedPositive,
    matchedNegative
  };
}

// Export globally for browser environment (handles Electron/VS Code preview module scopes)
if (typeof window !== 'undefined') {
  window.analyzeComment = analyzeComment;
  window.tokenize = tokenize;
  window.SENTIMENT_LEXICON = SENTIMENT_LEXICON;
  window.NEGATION_WORDS = NEGATION_WORDS;
}

// Export for Node/Jest testing environment
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    analyzeComment,
    tokenize,
    SENTIMENT_LEXICON,
    NEGATION_WORDS
  };
}
