export interface DialogueTurn {
  id: number;
  partnerEn: string;
  partnerKo: string;
  studentTarget: string;
  studentKo: string;
  keyWords: string[];
  chunks: string[];
  primaryMissingHintWord: string;
  firstLetterHint: string;
  itemReceipt?: {
    nameEn: string;
    nameKo: string;
    price: number;
    qty: number;
  };
}

export interface FeedbackResult {
  success: boolean;
  category: 'success' | 'success_missing_small' | 'recast' | 'elicitation' | 'chunking' | 'no_speech';
  feedbackEn: string;
  feedbackKo: string;
  recognizedText: string;
  missingWord?: string;
  hint?: string;
}

export interface TurnRecord {
  turnId: number;
  targetSentence: string;
  spokenText: string;
  isSuccess: boolean;
  isSkipped: boolean;
  attempts: number;
  feedbackHistory: FeedbackResult[];
}

export const DIALOGUE_DATA: DialogueTurn[] = [
  {
    id: 1,
    partnerEn: "Hi! What would you like?",
    partnerKo: "안녕하세요! 무엇을 드릴까요?",
    studentTarget: "Can I have a sandwich, please?",
    studentKo: "샌드위치 하나 주세요.",
    keyWords: ["can i have", "sandwich", "please"],
    chunks: ["Can I have", "a sandwich, please?"],
    primaryMissingHintWord: "sandwich",
    firstLetterHint: "s______",
    itemReceipt: {
      nameEn: "Fresh Sandwich",
      nameKo: "신선한 샌드위치",
      price: 2.50,
      qty: 1
    }
  },
  {
    id: 2,
    partnerEn: "Sure! Anything else?",
    partnerKo: "물론이죠! 더 필요한 것 있으세요?",
    studentTarget: "An apple juice, please.",
    studentKo: "사과 주스 하나 주세요.",
    keyWords: ["apple juice", "please"],
    chunks: ["An apple juice,", "please."],
    primaryMissingHintWord: "apple juice",
    firstLetterHint: "a____ j____",
    itemReceipt: {
      nameEn: "Apple Juice (Bottle)",
      nameKo: "사과 주스",
      price: 1.50,
      qty: 1
    }
  },
  {
    id: 3,
    partnerEn: "Here you go!",
    partnerKo: "여기 있습니다!",
    studentTarget: "How much is it?",
    studentKo: "얼마인가요?",
    keyWords: ["how", "much"],
    chunks: ["How much", "is it?"],
    primaryMissingHintWord: "much",
    firstLetterHint: "m___",
  },
  {
    id: 4,
    partnerEn: "It's four dollars.",
    partnerKo: "4달러입니다.",
    studentTarget: "Here you are.",
    studentKo: "여기 있습니다.",
    keyWords: ["here", "you", "are"],
    chunks: ["Here", "you are."],
    primaryMissingHintWord: "here",
    firstLetterHint: "h___",
  },
  {
    id: 5,
    partnerEn: "Thank you! Have a nice day!",
    partnerKo: "감사합니다! 좋은 하루 보내세요!",
    studentTarget: "Thank you! Bye!",
    studentKo: "감사합니다! 안녕히 계세요!",
    keyWords: ["thank you", "bye"],
    chunks: ["Thank you!", "Bye!"],
    primaryMissingHintWord: "bye",
    firstLetterHint: "b__",
  }
];

export const STATIC_FEEDBACK_TABLE = {
  success: {
    en: "Great job! I understood you clearly!",
    ko: "잘했어요! 무슨 말인지 잘 알아들었어요!"
  },
  success_missing_small: (missingWord: string) => ({
    en: `Nice work! Next time, try adding "${missingWord}".`,
    ko: `잘했어요! 다음에는 빠진 단어도 넣어 보세요.`
  }),
  recast: (targetSentence: string) => ({
    en: `Good try! You can say, "${targetSentence}"`,
    ko: `좋은 시도예요! 이렇게 말해 보세요.`
  }),
  elicitation: (hint: string) => ({
    en: `Almost there! Can you say the word starting with "${hint}"?`,
    ko: `거의 다 왔어요! 제시된 글자로 시작하는 단어를 말해 볼까요?`
  }),
  chunking: (chunks: string[]) => ({
    en: `Keep going! Let's say it in parts: "${chunks.join('" / "')}"`,
    ko: `계속해 봐요! 문장을 나누어 말해 볼까요?`
  }),
  no_speech: {
    en: "That's okay! Tap the microphone and try speaking again.",
    ko: "괜찮아요! 마이크를 누르고 다시 말해 보세요."
  }
};
