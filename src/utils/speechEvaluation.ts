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
  const missingTargetTokens: string[] = [];

  for (const tToken of targetTokens) {
    if (spokenTokens.some((sToken) => isTokenMatch(sToken, tToken))) {
      matchedTokens.push(tToken);
    } else {
      missingTargetTokens.push(tToken);
    }
  }

  // Determine the first missing target word for smart, student-aware guidance
  const firstMissingWord = missingTargetTokens.length > 0 ? missingTargetTokens[0] : turn.primaryMissingHintWord;
  const firstMissingLetter = firstMissingWord ? firstMissingWord.charAt(0).toUpperCase() : '';
  const firstMissingHintStr = firstMissingWord ? `${firstMissingLetter}${'_'.repeat(Math.max(1, firstMissingWord.length - 1))}` : turn.firstLetterHint;

  // Key words missing -> Failure feedback progression (Section 7):
  // 1st failure: recast
  // 2nd failure: elicitation (first-letter hints for the missing part)
  // 3rd failure: chunking
  if (failureAttemptNumber <= 1) {
    if (matchedTokens.length > 0) {
      const matchedPhrase = matchedTokens.join(' ');
      return {
        success: false,
        category: 'recast',
        feedbackEn: `Good try! You said "${matchedPhrase}". Let's say: "${turn.studentTarget}"`,
        feedbackKo: `좋은 시도예요! "${matchedPhrase}"에 이어서 전체 문장("${turn.studentTarget}")으로 말해 보세요.`,
        recognizedText: spokenText,
        hint: turn.studentTarget,
      };
    }
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
    // If student already said some words (e.g. student said "here"), don't ask for "H"!
    // Ask for the FIRST MISSING word!
    if (matchedTokens.length > 0 && firstMissingWord) {
      return {
        success: false,
        category: 'elicitation',
        feedbackEn: `Almost there! You said "${matchedTokens.join(' ')}". Can you say the next word starting with "${firstMissingLetter}"?`,
        feedbackKo: `거의 다 왔어요! "${matchedTokens.join(' ')}" 다음의 '${firstMissingLetter}'로 시작하는 단어를 말해 볼까요?`,
        recognizedText: spokenText,
        hint: firstMissingHintStr,
      };
    }
    const elicitation = STATIC_FEEDBACK_TABLE.elicitation(turn.firstLetterHint);
    return {
      success: false,
      category: 'elicitation',
      feedbackEn: elicitation.en,
      feedbackKo: elicitation.ko,
      recognizedText: spokenText,
      hint: turn.firstLetterHint,
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
