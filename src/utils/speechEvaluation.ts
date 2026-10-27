import { DialogueTurn, FeedbackResult, STATIC_FEEDBACK_TABLE } from '../data/dialogueData';

/**
 * Normalizes text by converting to lowercase, stripping punctuation, and trimming extra whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Splits text into normalized individual tokens.
 */
export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(' ') : [];
}

function isTokenMatch(spokenToken: string, targetToken: string): boolean {
  const s = spokenToken.toLowerCase().trim();
  const t = targetToken.toLowerCase().trim();
  return s === t;
}

const ARTICLES = new Set(['a', 'an', 'the']);

export interface ElicitationAnalysis {
  matchedTokens: string[];
  matchedPhrase: string;
  missingWord: string;
  missingLetter: string;
  hintStr: string;
  position: 'front' | 'middle' | 'end';
  blankSentence: string;
  hintBlankSentence: string;
  elicitationSentence: string;
}

/**
 * Analyzes target sentence vs student spoken tokens specifically for Elicitation (2nd failure attempt).
 * Excludes articles (a, an, the) from missing word hints per PRD rules.
 * Accurately determines word order alignment, relative position (front, middle, end), and embedded first-letter hint sentence.
 */
export function analyzeElicitationTarget(
  targetSentence: string,
  spokenText: string
): ElicitationAnalysis {
  const targetTokens = tokenize(targetSentence);

  // Extract clean target words from original sentence string (strip punctuation, keep casing)
  const targetWordsRaw = targetSentence
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ''))
    .filter(Boolean);

  const spokenTokens = tokenize(spokenText);

  // Sequence alignment: match spoken tokens to target tokens in relative order
  const matchedTargetIndices: number[] = [];
  let spokenSearchIdx = 0;

  for (let targetIdx = 0; targetIdx < targetTokens.length; targetIdx++) {
    const targetToken = targetTokens[targetIdx];
    let foundAt = -1;

    for (let s = spokenSearchIdx; s < spokenTokens.length; s++) {
      if (isTokenMatch(spokenTokens[s], targetToken)) {
        foundAt = s;
        break;
      }
    }

    if (foundAt === -1) {
      for (let s = 0; s < spokenTokens.length; s++) {
        if (isTokenMatch(spokenTokens[s], targetToken)) {
          foundAt = s;
          break;
        }
      }
    }

    if (foundAt !== -1) {
      matchedTargetIndices.push(targetIdx);
      spokenSearchIdx = Math.max(spokenSearchIdx, foundAt + 1);
    }
  }

  const matchedTokens = matchedTargetIndices.map((idx) => targetWordsRaw[idx] || targetTokens[idx]);
  const matchedPhrase = matchedTokens.join(' ');

  // Identify missing target token indices that are NOT articles (a, an, the)
  const missingNonArticleIndices = targetTokens
    .map((_, idx) => idx)
    .filter(
      (idx) =>
        !matchedTargetIndices.includes(idx) &&
        !ARTICLES.has(targetTokens[idx].toLowerCase())
    );

  let firstMissingIdx = 0;
  if (missingNonArticleIndices.length > 0) {
    firstMissingIdx = missingNonArticleIndices[0];
  }

  const missingWordRaw = targetWordsRaw[firstMissingIdx] || targetTokens[firstMissingIdx] || 'word';
  const missingLetter = missingWordRaw.charAt(0).toUpperCase();
  const hintStr = `${missingLetter.toLowerCase()}${'_'.repeat(Math.max(1, missingWordRaw.length - 1))}`;

  // Build sentence completion fill-in-the-blanks and embedded first-letter hint sentence
  let blankSentence = targetSentence;
  let hintBlankSentence = targetSentence;
  let elicitationSentence = targetSentence;

  const regex = new RegExp(`\\b${missingWordRaw}\\b`, 'i');
  if (regex.test(targetSentence)) {
    blankSentence = targetSentence.replace(regex, '[ ___ ]');
    hintBlankSentence = targetSentence.replace(regex, `[ ${hintStr} ]`);
    elicitationSentence = targetSentence.replace(regex, hintStr);
  } else {
    const lowerTarget = targetSentence.toLowerCase();
    const lowerMissing = missingWordRaw.toLowerCase();
    const idx = lowerTarget.indexOf(lowerMissing);
    if (idx !== -1) {
      blankSentence = targetSentence.substring(0, idx) + '[ ___ ]' + targetSentence.substring(idx + missingWordRaw.length);
      hintBlankSentence = targetSentence.substring(0, idx) + `[ ${hintStr} ]` + targetSentence.substring(idx + missingWordRaw.length);
      elicitationSentence = targetSentence.substring(0, idx) + hintStr + targetSentence.substring(idx + missingWordRaw.length);
    }
  }

  // Check if matched words occur before or after this missing word index
  const hasMatchedBefore = matchedTargetIndices.some((idx) => idx < firstMissingIdx);
  const hasMatchedAfter = matchedTargetIndices.some((idx) => idx > firstMissingIdx);

  let position: 'front' | 'middle' | 'end' = 'middle';
  if (!hasMatchedBefore) {
    position = 'front';
  } else if (!hasMatchedAfter) {
    position = 'end';
  }

  return {
    matchedTokens,
    matchedPhrase,
    missingWord: missingWordRaw,
    missingLetter,
    hintStr,
    position,
    blankSentence,
    hintBlankSentence,
    elicitationSentence,
  };
}

/**
 * Rule-based local evaluation adhering strictly to Section 7 of PRD.
 * Works completely offline or when Gemini is unavailable.
 */
export function evaluateSpokenTextLocally(
  spokenText: string,
  turn: DialogueTurn,
  failureAttemptNumber: number // 1 for first failure, 2 for second, 3+ for third
): FeedbackResult {
  const normSpoken = normalizeText(spokenText || '');
  if (!normSpoken) {
    return {
      success: false,
      category: 'no_speech',
      feedbackEn: STATIC_FEEDBACK_TABLE.no_speech.en,
      feedbackKo: STATIC_FEEDBACK_TABLE.no_speech.ko,
      recognizedText: '',
    };
  }

  const spokenTokens = tokenize(spokenText);
  const targetTokens = tokenize(turn.studentTarget);

  // Check key words presence (Section 6 & 7: "Count response as successful when all key words are recognized")
  const missingKeyWords: string[] = [];

  for (const kw of turn.keyWords) {
    const kwTokens = tokenize(kw);
    // All tokens of the keyword phrase must be found in spokenTokens
    const kwMatched = kwTokens.every((kwT) =>
      spokenTokens.some((spokenT) => isTokenMatch(spokenT, kwT))
    );
    if (!kwMatched) {
      missingKeyWords.push(kw);
    }
  }

  // All key words recognized?
  if (missingKeyWords.length === 0) {
    // Find if any small non-key words were omitted
    const missingSmallTokens: string[] = [];

    for (let i = 0; i < targetTokens.length; i++) {
      const targetT = targetTokens[i];
      const matched = spokenTokens.some((spokenT) => isTokenMatch(spokenT, targetT));
      if (!matched) {
        missingSmallTokens.push(targetT);
      }
    }

    if (missingSmallTokens.length > 0) {
      const missingWord = missingSmallTokens[0];
      const template = STATIC_FEEDBACK_TABLE.success_missing_small(missingWord);
      return {
        success: true,
        category: 'success_missing_small',
        feedbackEn: template.en,
        feedbackKo: template.ko,
        recognizedText: spokenText,
        missingWord,
      };
    }

    // Completely matched!
    return {
      success: true,
      category: 'success',
      feedbackEn: STATIC_FEEDBACK_TABLE.success.en,
      feedbackKo: STATIC_FEEDBACK_TABLE.success.ko,
      recognizedText: spokenText,
    };
  }

  // Identify which words the student DID say vs what is missing
  const matchedTokens: string[] = [];

  for (const tToken of targetTokens) {
    if (spokenTokens.some((sToken) => isTokenMatch(sToken, tToken))) {
      matchedTokens.push(tToken);
    }
  }

  // Key words missing -> Failure feedback progression (Section 7):
  // 1st failure: recast
  // 2nd failure: elicitation (first-letter hints for the missing part)
  // 3rd failure: chunking
  if (failureAttemptNumber <= 1) {
    const recast = STATIC_FEEDBACK_TABLE.recast(turn.studentTarget);
    return {
      success: false,
      category: 'recast',
      feedbackEn: recast.en,
      feedbackKo: recast.ko,
      recognizedText: spokenText,
      hint: turn.studentTarget,
    };
  } else if (failureAttemptNumber === 2) {
    // 2nd failure: Elicitation embedding first-letter hint into target sentence prompt at missing word position
    const analysis = analyzeElicitationTarget(turn.studentTarget, spokenText);
    const { elicitationSentence, hintStr } = analysis;

    return {
      success: false,
      category: 'elicitation',
      feedbackEn: `Almost there! ${elicitationSentence}`,
      feedbackKo: `거의 다 왔어요! ${elicitationSentence}`,
      recognizedText: spokenText,
      hint: hintStr,
    };
  } else {
    const chunking = STATIC_FEEDBACK_TABLE.chunking(turn.chunks);
    return {
      success: false,
      category: 'chunking',
      feedbackEn: chunking.en,
      feedbackKo: chunking.ko,
      recognizedText: spokenText,
      hint: turn.chunks.join(' / '),
    };
  }
}
