import { IExam } from '../exams/exam.model';

type IncomingAnswer = {
  questionId?: string;
  questionKey?: string;
  selectedOption?: number;
  selectedOptions?: number[];
  selectedNumeric?: number;
};

type ValidationResult = { ok: true } | { ok: false; message: string };

function normalizeQuestionKey(answer: IncomingAnswer): string | null {
  const key = String(answer.questionKey || answer.questionId || '').trim();
  return key.length > 0 ? key : null;
}

function isAttempted(answer: IncomingAnswer): boolean {
  if (Array.isArray(answer.selectedOptions) && answer.selectedOptions.length > 0) return true;
  if (typeof answer.selectedOption === 'number' && answer.selectedOption >= 0) return true;
  if (typeof answer.selectedNumeric === 'number' && !Number.isNaN(answer.selectedNumeric)) return true;
  return false;
}

export function validateStrictAttemptRules(exam: IExam, answers: IncomingAnswer[]): ValidationResult {
  const maxAttempts = (exam as any).maxAttempts as number | undefined;
  const sections = ((exam as any).sections || []) as any[];

  const attemptedKeys = new Set<string>();
  for (const a of answers) {
    if (!isAttempted(a)) continue;
    const k = normalizeQuestionKey(a);
    if (k) attemptedKeys.add(k);
  }

  if (typeof maxAttempts === 'number' && maxAttempts > 0 && attemptedKeys.size > maxAttempts) {
    return { ok: false, message: `Attempt limit exceeded: max ${maxAttempts} allowed` };
  }

  if (!Array.isArray(sections) || sections.length === 0) return { ok: true };

  const isJee = String((exam as any).testType || '').toUpperCase() === 'JEE';
  const questionToSubject = new Map<string, string>();

  for (const section of sections) {
    const sectionQuestionIds: string[] = Array.isArray(section.questionIds) ? section.questionIds : [];
    const subjectKey = String(section.subjectKey || '').toUpperCase();
    if (subjectKey && sectionQuestionIds.length > 0) {
      for (const id of sectionQuestionIds) questionToSubject.set(String(id), subjectKey);
    }
  }

  for (const section of sections) {
    const questionIds: string[] = Array.isArray(section.questionIds) ? section.questionIds : [];
    if (questionIds.length === 0) continue;
    const attemptedInSection = questionIds.filter((id) => attemptedKeys.has(String(id))).length;
    const max = typeof section.maxAttempts === 'number' ? section.maxAttempts : questionIds.length;
    if (attemptedInSection > max) {
      return {
        ok: false,
        message: `${section.sectionName || section.sectionId}: attempt limit ${max} exceeded`,
      };
    }
  }

  if (isJee) {
    const attemptedPerSubject = new Map<string, number>();
    for (const questionKey of attemptedKeys) {
      const subject = questionToSubject.get(questionKey);
      if (!subject) continue;
      attemptedPerSubject.set(subject, (attemptedPerSubject.get(subject) || 0) + 1);
    }

    for (const [subject, count] of attemptedPerSubject.entries()) {
      if (count > 25) {
        return {
          ok: false,
          message: `${subject}: you can attempt up to 25 questions per subject`,
        };
      }
    }
  }

  return { ok: true };
}
