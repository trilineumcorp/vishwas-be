/**
 * IIT-JEE / NEET style scoring: +ve / -ve marks, unattempted = 0, optional multi-correct.
 */

export type QuestionType = 'single' | 'multi';

export interface ExamQuestionForEval {
  /** Stable key e.g. q1 or subdocument id string */
  questionKey: string;
  questionType?: QuestionType;
  /** Single-correct index (legacy) */
  correctAnswer: number;
  /** Multi-correct: set of correct option indices */
  correctOptionIndices?: number[];
  /** Max positive marks for this question */
  marks: number;
  /** Negative marks when wrong (e.g. -1). Stored as negative number. */
  wrongMarks: number;
  subjectId?: string;
  sectionId?: string;
  competitiveType?: 'MCQ' | 'NUMERICAL';
  correctNumericAnswer?: number;
}

export interface AnswerPayload {
  questionKey: string;
  /** Single index, or multiple for multi-select */
  selectedOption?: number;
  selectedOptions?: number[];
  selectedNumeric?: number;
}

export interface PerQuestionScore {
  questionKey: string;
  gained: number;
  isCorrect: boolean;
  attempted: boolean;
  subjectId?: string;
  sectionId?: string;
}

export interface EvaluationOutcome {
  rawScore: number;
  maxScore: number;
  percentage: number;
  accuracy: {
    correct: number;
    attempted: number;
    wrong: number;
    unattempted: number;
  };
  subjectBreakdown: Array<{
    subjectId: string;
    rawScore: number;
    maxScore: number;
    correct: number;
    attempted: number;
  }>;
  perQuestion: PerQuestionScore[];
}

function correctIndexSet(q: ExamQuestionForEval): Set<number> {
  if (q.correctOptionIndices && q.correctOptionIndices.length > 0) {
    return new Set(q.correctOptionIndices);
  }
  return new Set([q.correctAnswer]);
}

function selectedSet(a: AnswerPayload): Set<number> {
  if (a.selectedOptions && a.selectedOptions.length > 0) {
    return new Set(a.selectedOptions);
  }
  if (
    typeof a.selectedOption === 'number' &&
    !Number.isNaN(a.selectedOption) &&
    a.selectedOption >= 0
  ) {
    return new Set([a.selectedOption]);
  }
  return new Set();
}

function selectedNumericValue(a: AnswerPayload): number | null {
  if (typeof a.selectedNumeric === 'number' && !Number.isNaN(a.selectedNumeric)) return a.selectedNumeric;
  return null;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) {
    if (!b.has(x)) return false;
  }
  return true;
}

function scoreOneQuestion(
  q: ExamQuestionForEval,
  selected: Set<number>,
  selectedNumeric: number | null,
  multiRule: 'all_or_nothing' | 'proportional'
): { gained: number; isCorrect: boolean; attempted: boolean } {
  if (q.competitiveType === 'NUMERICAL') {
    const attempted = selectedNumeric !== null;
    if (!attempted) return { gained: 0, isCorrect: false, attempted: false };
    const expected = Number(q.correctNumericAnswer);
    const ok = Number.isFinite(expected) && Math.abs(selectedNumeric - expected) < 1e-6;
    return ok
      ? { gained: q.marks, isCorrect: true, attempted: true }
      : { gained: q.wrongMarks, isCorrect: false, attempted: true };
  }

  const attempted = selected.size > 0;
  if (!attempted) {
    return { gained: 0, isCorrect: false, attempted: false };
  }

  const corr = correctIndexSet(q);
  const type = q.questionType || (corr.size > 1 ? 'multi' : 'single');

  if (type === 'single' || corr.size === 1) {
    const sel = [...selected][0];
    const ok = selected.size === 1 && corr.has(sel);
    return ok
      ? { gained: q.marks, isCorrect: true, attempted: true }
      : { gained: q.wrongMarks, isCorrect: false, attempted: true };
  }

  // multi
  if (multiRule === 'all_or_nothing') {
    const ok = setsEqual(selected, corr);
    return ok
      ? { gained: q.marks, isCorrect: true, attempted: true }
      : { gained: q.wrongMarks, isCorrect: false, attempted: true };
  }

  // proportional: correct picks / total correct keys, no wrong option selected
  let correctPicks = 0;
  for (const c of corr) {
    if (selected.has(c)) correctPicks++;
  }
  let wrongPick = false;
  for (const s of selected) {
    if (!corr.has(s)) wrongPick = true;
  }
  if (wrongPick) {
    return { gained: q.wrongMarks, isCorrect: false, attempted: true };
  }
  const frac = corr.size > 0 ? correctPicks / corr.size : 0;
  const gained = Math.round(frac * q.marks * 1000) / 1000;
  const isCorrect = gained >= q.marks;
  return { gained, isCorrect, attempted: true };
}

export function buildQuestionsForEval(
  exam: {
    questions: Array<{
      question?: string;
      options?: string[];
      correctAnswer: number;
      correctOptionIndices?: number[];
      marks: number;
      questionKey?: string;
      questionType?: QuestionType;
      subjectId?: string;
      sectionId?: string;
      competitiveType?: 'MCQ' | 'NUMERICAL';
      correctNumericAnswer?: number;
    }>;
    markingDefaults?: { correctMarks?: number; wrongMarks?: number };
  },
  questionKeyByIndex: (idx: number) => string
): ExamQuestionForEval[] {
  const defPos = exam.markingDefaults?.correctMarks;
  const defNeg = exam.markingDefaults?.wrongMarks ?? 0;

  return exam.questions.map((q, idx) => {
    const qk = q.questionKey || questionKeyByIndex(idx);
    const marks = typeof q.marks === 'number' ? q.marks : defPos ?? 1;
    const wrongMarks =
      typeof defNeg === 'number' ? defNeg : 0;

    return {
      questionKey: qk,
      questionType: q.questionType,
      correctAnswer: q.correctAnswer,
      correctOptionIndices: q.correctOptionIndices,
      marks,
      wrongMarks,
      subjectId: q.subjectId,
      sectionId: q.sectionId,
      competitiveType: q.competitiveType,
      correctNumericAnswer: q.correctNumericAnswer,
    };
  });
}

export function evaluateExamAttempt(
  questions: ExamQuestionForEval[],
  answers: AnswerPayload[],
  options: { multiRule?: 'all_or_nothing' | 'proportional' } = {}
): EvaluationOutcome {
  const multiRule = options.multiRule ?? 'all_or_nothing';
  const byKey = new Map(answers.map((a) => [a.questionKey, a]));

  let rawScore = 0;
  let maxScore = 0;
  let correct = 0;
  let attempted = 0;
  let wrong = 0;
  let unattempted = 0;

  const subjectMap = new Map<
    string,
    { rawScore: number; maxScore: number; correct: number; attempted: number }
  >();

  const perQuestion: PerQuestionScore[] = [];

  for (const q of questions) {
    maxScore += q.marks;
    const ans = byKey.get(q.questionKey);
    const sel = ans ? selectedSet(ans) : new Set<number>();
    const selNum = ans ? selectedNumericValue(ans) : null;
    const r = scoreOneQuestion(q, sel, selNum, multiRule);

    rawScore += r.gained;
    if (r.attempted) attempted++;
    else unattempted++;
    if (r.isCorrect) correct++;
    else if (r.attempted) wrong++;

    perQuestion.push({
      questionKey: q.questionKey,
      gained: r.gained,
      isCorrect: r.isCorrect,
      attempted: r.attempted,
      subjectId: q.subjectId,
      sectionId: q.sectionId,
    });

    const sid = q.subjectId || 'GENERAL';
    if (!subjectMap.has(sid)) {
      subjectMap.set(sid, { rawScore: 0, maxScore: 0, correct: 0, attempted: 0 });
    }
    const sb = subjectMap.get(sid)!;
    sb.maxScore += q.marks;
    sb.rawScore += r.gained;
    if (r.isCorrect) sb.correct++;
    if (r.attempted) sb.attempted++;
  }

  const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0;

  return {
    rawScore,
    maxScore,
    percentage: Math.round(percentage * 100) / 100,
    accuracy: {
      correct,
      attempted,
      wrong,
      unattempted,
    },
    subjectBreakdown: [...subjectMap.entries()].map(([subjectId, v]) => ({
      subjectId,
      ...v,
    })),
    perQuestion,
  };
}
