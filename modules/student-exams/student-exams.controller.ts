import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { Exam, IExam } from '../exams/exam.model';
import { ExamResult } from '../exam-results/exam-result.model';
import { ExamAttempt } from '../exam-attempts/exam-attempt.model';
import { Student } from '../student/student.model';
import {
  AnswerPayload,
  buildQuestionsForEval,
  evaluateExamAttempt,
} from '../exams/exam-evaluation.service';
import { leaderboardService } from '../leaderboard/leaderboard.service';
import { LeaderboardScope } from '../leaderboard/leaderboard.model';
import { LeaderboardEntry } from '../leaderboard/leaderboard.model';
import { logger } from '../../utils/logger';
import { validateStrictAttemptRules } from './attempt-validation';
import { UserExamAttempt } from '../user-exam-attempts/user-exam-attempt.model';

type StudentAnswerPayload = {
  questionId: string;
  selectedOption?: number;
  selectedOptions?: number[];
  selectedNumeric?: number;
};

function questionKeyFromIndex(idx: number): string {
  return `q${idx + 1}`;
}

function getDayBounds(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function mapAnswersToPayload(
  answers: StudentAnswerPayload[],
  exam: IExam
): AnswerPayload[] {
  return answers.map((a) => {
    const qId = String(a.questionId ?? '');
    let idx = -1;
    const qMatch = qId.match(/^q(\d+)$/i);
    if (qMatch) idx = parseInt(qMatch[1], 10) - 1;

    const q =
      idx >= 0 && idx < exam.questions.length ? exam.questions[idx] : undefined;
    const key = q?.questionKey || qId || (idx >= 0 ? questionKeyFromIndex(idx) : qId);

    if (a.selectedOptions && a.selectedOptions.length > 0) {
      return { questionKey: key, selectedOptions: a.selectedOptions };
    }
    if (typeof a.selectedNumeric === 'number' && !Number.isNaN(a.selectedNumeric)) {
      return { questionKey: key, selectedOption: a.selectedNumeric };
    }
    if (typeof a.selectedOption === 'number' && a.selectedOption >= 0) {
      return { questionKey: key, selectedOption: a.selectedOption };
    }
    return { questionKey: key };
  });
}

function buildResultAnswers(
  exam: IExam,
  answers: StudentAnswerPayload[],
  perQuestion: Array<{
    questionKey: string;
    gained: number;
    isCorrect: boolean;
    attempted: boolean;
  }>
) {
  const byKey = new Map(perQuestion.map((p) => [p.questionKey, p]));
  return answers.map((a) => {
    const qId = String(a.questionId ?? '');
    let idx = -1;
    const qMatch = qId.match(/^q(\d+)$/i);
    if (qMatch) idx = parseInt(qMatch[1], 10) - 1;
    const q =
      idx >= 0 && idx < exam.questions.length ? exam.questions[idx] : undefined;
    const key = q?.questionKey || qId || (idx >= 0 ? questionKeyFromIndex(idx) : qId);
    const pq = byKey.get(key);
    const sel =
      a.selectedOptions && a.selectedOptions.length > 0
        ? a.selectedOptions[0]
        : typeof a.selectedNumeric === 'number' && !Number.isNaN(a.selectedNumeric)
          ? a.selectedNumeric
        : typeof a.selectedOption === 'number' && a.selectedOption >= 0
          ? a.selectedOption
          : -1;
    return {
      questionId: qId,
      selectedAnswer: sel,
      selectedOptions: a.selectedOptions,
      isCorrect: pq?.isCorrect ?? false,
      marksGained: pq?.gained,
    };
  });
}

export class StudentExamsController {
  private buildSectionsFromExam(exam: IExam) {
    const questions = exam.questions.map((q: any, idx: number) => ({
      id: q.questionKey ?? `q${idx + 1}`,
      number: idx + 1,
      question: q.question,
      options: q.options,
      marks: q.marks ?? 1,
      questionType: q.questionType || 'single',
      subjectId: q.subjectId,
      sectionId: q.sectionId,
    }));

    if (Array.isArray((exam as any).sections) && (exam as any).sections.length > 0) {
      const byId = new Map(questions.map((q) => [q.id, q]));
      const sections = (exam as any).sections.map((section: any) => {
        const mappedQs = (Array.isArray(section.questionIds) ? section.questionIds : [])
          .map((qId: string) => byId.get(qId))
          .filter(Boolean)
          .map((q: any, i: number) => ({ ...q, number: i + 1 }));
        return {
          id: section.sectionId,
          name: section.sectionName,
          subjectKey: section.subjectKey,
          sectionType: section.sectionType,
          maxAttempts: section.maxAttempts,
          totalQuestions: section.totalQuestions,
          isOptional: section.isOptional,
          questions: mappedQs,
        };
      });
      if (sections.every((s: any) => Array.isArray(s.questions) && s.questions.length > 0)) {
        return sections;
      }
    }

    const total = questions.length;
    const splitIndex = Math.ceil(total / 2);
    const sectionAQuestions = questions.slice(0, splitIndex);
    const sectionBQuestions = questions.slice(splitIndex);
    const fallback: any[] = [
      {
        id: 'A',
        name: 'Section A (MCQs)',
        subjectKey: 'GENERAL',
        questions: sectionAQuestions.map((q, i) => ({ ...q, number: i + 1 })),
      },
    ];
    if (sectionBQuestions.length > 0) {
      fallback.push({
        id: 'B',
        name: 'Section B',
        subjectKey: 'GENERAL',
        questions: sectionBQuestions.map((q, i) => ({ ...q, number: i + 1 })),
      });
    }
    return fallback;
  }

  async getStudentExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const examId = Array.isArray(id) ? id[0] : id;
      if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
        res.status(400).json({ success: false, message: 'Invalid exam id' });
        return;
      }

      const exam = await Exam.findById(examId).select('-__v');
      if (!exam || !exam.isActive) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      const sections = this.buildSectionsFromExam(exam);
      const totalQuestions = exam.questions.length;

      res.status(200).json({
        success: true,
        message: 'Exam fetched successfully',
        data: {
          exam: {
            id: (exam._id as any).toString(),
            title: exam.testName || exam.title,
            examName: exam.testName || exam.title,
            testName: exam.testName || exam.title,
            testType: (exam as any).testType || exam.examType,
            duration: exam.duration,
            totalQuestions,
            maxAttempts: (exam as any).maxAttempts,
            totalMarks: exam.totalMarks,
            standard: exam.standard,
            subject: exam.subject,
            examType: exam.examType,
            examSchemaVersion: exam.examSchemaVersion ?? 1,
            markingDefaults: exam.markingDefaults,
            sections,
            subjects: [
              {
                name: exam.subject || 'General',
                sections,
              },
            ],
          },
        },
      });
    } catch (error: any) {
      logger.error('Get student exam error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch student exam',
      });
    }
  }

  async getStudentExams(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { standard, subject, examType, view } = req.query as Record<string, string | undefined>;
      const examFilter: any = { isActive: true };

      if (standard) {
        const s = parseInt(standard, 10);
        if (!Number.isNaN(s)) {
          examFilter.$or = [{ standard: s }, { standard: { $exists: false } }, { standard: null }];
        }
      }
      if (subject) examFilter.subject = subject;
      if (examType) examFilter.examType = examType;

      const exams = await Exam.find(examFilter).sort({ createdAt: -1 }).select('-__v').lean();
      const examIds = exams.map((e: any) => e._id);
      const attempts = await UserExamAttempt.find({
        userId: req.user!.id,
        examId: { $in: examIds },
      }).lean();

      const byExamId = new Map(attempts.map((a: any) => [String(a.examId), a]));
      const { start: startOfToday } = getDayBounds();

      const enriched = exams.map((exam: any) => {
        const attempt = byExamId.get(String(exam._id));
        const completedAt = attempt?.completedAt ? new Date(attempt.completedAt) : undefined;
        const attemptedAt = attempt?.attemptedAt ? new Date(attempt.attemptedAt) : undefined;
        const isAttempted = attempt?.status === 'COMPLETED';
        const isCompletedBeforeToday = !!completedAt && completedAt < startOfToday;
        return {
          ...exam,
          id: String(exam._id),
          isAttempted,
          attemptStatus: attempt?.status || 'NOT_STARTED',
          attemptedAt: attemptedAt?.toISOString(),
          completedAt: completedAt?.toISOString(),
          score: typeof attempt?.score === 'number' ? attempt.score : undefined,
          _isCompletedBeforeToday: isCompletedBeforeToday,
        };
      });

      const normalizedView = (view || 'active').toLowerCase();
      const filtered =
        normalizedView === 'previous'
          ? enriched.filter((exam: any) => exam.isAttempted && exam._isCompletedBeforeToday)
          : enriched.filter((exam: any) => !exam.isAttempted || !exam._isCompletedBeforeToday);

      res.status(200).json({
        success: true,
        data: filtered.map(({ _isCompletedBeforeToday, ...exam }) => exam),
      });
    } catch (error: any) {
      logger.error('Get student exams list error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch student exams',
      });
    }
  }

  /** Legacy + enhanced: evaluates with JEE/NEET rules when configured */
  async submitStudentExam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { examId, answers, timeSpentMs } = req.body as {
        examId: string;
        answers: StudentAnswerPayload[];
        timeSpentMs?: number;
      };

      if (!examId || !Array.isArray(answers)) {
        res.status(400).json({
          success: false,
          message: 'examId and answers[] are required',
        });
        return;
      }

      const exam = await Exam.findById(examId);
      if (!exam || !exam.isActive) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      const strictValidation = validateStrictAttemptRules(exam, answers);
      if (!strictValidation.ok) {
        const message = (strictValidation as any).message as string;
        res.status(400).json({ success: false, message });
        return;
      }

      const evalQuestions = buildQuestionsForEval(exam as any, questionKeyFromIndex);
      const payloads = mapAnswersToPayload(answers, exam);
      const multiRule = exam.multiCorrectRule === 'proportional' ? 'proportional' : 'all_or_nothing';
      const outcome = evaluateExamAttempt(evalQuestions, payloads, { multiRule });

      const resultAnswers = buildResultAnswers(exam, answers, outcome.perQuestion);

      const created = await ExamResult.create({
        examId,
        examTitle: exam.title,
        studentId: req.user!.id,
        score: Math.max(0, outcome.rawScore),
        totalMarks: outcome.maxScore,
        percentage: Math.round(outcome.percentage * 100) / 100,
        accuracy: outcome.accuracy,
        subjectBreakdown: outcome.subjectBreakdown.map((s) => ({
          subjectId: s.subjectId,
          rawScore: s.rawScore,
          maxScore: s.maxScore,
          correct: s.correct,
          attempted: s.attempted,
        })),
        timeSpentMs,
        evaluationVersion: 2,
        answers: resultAnswers,
        completedAt: new Date(),
      });

      await UserExamAttempt.findOneAndUpdate(
        { userId: req.user!.id, examId: exam._id },
        {
          $set: {
            status: 'COMPLETED',
            score: Math.max(0, outcome.rawScore),
            completedAt: created.completedAt,
          },
          $setOnInsert: {
            attemptedAt: created.completedAt,
          },
        },
        { upsert: true, new: true }
      );

      await UserExamAttempt.findOneAndUpdate(
        { userId: req.user!.id, examId: exam._id },
        {
          $set: {
            status: 'COMPLETED',
            score: Math.max(0, outcome.rawScore),
            completedAt: created.completedAt,
          },
          $setOnInsert: {
            attemptedAt: created.completedAt,
          },
        },
        { upsert: true, new: true }
      );

      const student = await Student.findById(req.user!.id).select('state city').lean();

      await leaderboardService.syncFromEvaluation(
        exam._id as mongoose.Types.ObjectId,
        req.user!.id as unknown as mongoose.Types.ObjectId,
        created.completedAt,
        timeSpentMs || 0,
        outcome,
        student as any
      );
      const globalEntry = await LeaderboardEntry.findOne({
        examId: exam._id as mongoose.Types.ObjectId,
        scope: 'GLOBAL',
        scopeKey: 'ALL',
        studentId: req.user!.id as unknown as mongoose.Types.ObjectId,
      }).lean();

      res.status(201).json({
        success: true,
        message: 'Exam submitted successfully',
        data: {
          ...created.toObject(),
          percentile: globalEntry?.percentile,
          overallRank: globalEntry?.rank,
          attemptedAllowed: {
            attempted: outcome.accuracy.attempted,
            allowed: (exam as any).maxAttempts || exam.questions.length,
          },
        },
      });
    } catch (error: any) {
      logger.error('Submit student exam error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit exam',
      });
    }
  }

  async startAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { examId } = req.body as { examId: string };
      if (!examId) {
        res.status(400).json({ success: false, message: 'examId is required' });
        return;
      }

      const exam = await Exam.findById(examId);
      if (!exam || !exam.isActive) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + exam.duration * 60 * 1000);

      const attempt = await ExamAttempt.create({
        examId: exam._id,
        studentId: req.user!.id,
        status: 'IN_PROGRESS',
        startedAt,
        endsAt,
        responses: [],
      });

      await UserExamAttempt.findOneAndUpdate(
        { userId: req.user!.id, examId: exam._id },
        {
          $set: { status: 'IN_PROGRESS' },
          $setOnInsert: { attemptedAt: startedAt },
        },
        { upsert: true, new: true }
      );

      res.status(201).json({
        success: true,
        data: {
          attemptId: attempt._id,
          examId: exam._id,
          startedAt,
          endsAt,
          durationMinutes: exam.duration,
        },
      });
    } catch (error: any) {
      logger.error('Start attempt error:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to start attempt',
      });
    }
  }

  async getAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const attempt = await ExamAttempt.findOne({
        _id: attemptId,
        studentId: req.user!.id,
      });
      if (!attempt) {
        res.status(404).json({ success: false, message: 'Attempt not found' });
        return;
      }
      res.json({ success: true, data: attempt });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async saveAttemptProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { responses } = req.body as {
        responses: Array<{
          questionKey: string;
          selectedOption?: number;
          selectedOptions?: number[];
          selectedNumeric?: number;
        }>;
      };

      const attempt = await ExamAttempt.findOne({
        _id: attemptId,
        studentId: req.user!.id,
        status: 'IN_PROGRESS',
      });
      if (!attempt) {
        res.status(404).json({ success: false, message: 'Attempt not found' });
        return;
      }

      if (attempt.endsAt && new Date() > attempt.endsAt) {
        attempt.status = 'EXPIRED';
        await attempt.save();
        res.status(400).json({ success: false, message: 'Exam time expired' });
        return;
      }

      if (responses && Array.isArray(responses)) {
        const exam = await Exam.findById(attempt.examId);
        if (!exam) {
          res.status(404).json({ success: false, message: 'Exam not found' });
          return;
        }
        const strictValidation = validateStrictAttemptRules(
          exam,
          responses.map((r) => ({ questionId: r.questionKey, ...r }))
        );
        if (!strictValidation.ok) {
          const message = (strictValidation as any).message as string;
          res.status(400).json({ success: false, message });
          return;
        }
        attempt.responses = responses.map((r) => ({
          questionKey: r.questionKey,
          selectedOption: r.selectedOption,
          selectedOptions: r.selectedOptions,
          selectedNumeric: r.selectedNumeric,
          answeredAt: new Date(),
        }));
      }
      await attempt.save();
      res.json({ success: true, data: attempt });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async submitAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { timeSpentMs } = req.body as { timeSpentMs?: number };

      const attempt = await ExamAttempt.findOne({
        _id: attemptId,
        studentId: req.user!.id,
      });
      if (!attempt) {
        res.status(404).json({ success: false, message: 'Attempt not found' });
        return;
      }
      if (attempt.status !== 'IN_PROGRESS') {
        res.status(400).json({ success: false, message: 'Attempt already closed' });
        return;
      }

      const exam = await Exam.findById(attempt.examId);
      if (!exam) {
        res.status(404).json({ success: false, message: 'Exam not found' });
        return;
      }

      const strictValidation = validateStrictAttemptRules(
        exam,
        attempt.responses.map((r) => ({
          questionId: r.questionKey,
          selectedOption: r.selectedOption,
          selectedOptions: r.selectedOptions,
          selectedNumeric: (r as any).selectedNumeric,
        }))
      );
      if (!strictValidation.ok) {
        const message = (strictValidation as any).message as string;
        res.status(400).json({ success: false, message });
        return;
      }

      const evalQuestions = buildQuestionsForEval(exam as any, questionKeyFromIndex);
      const payloads: AnswerPayload[] = attempt.responses.map((r) => {
        if (r.selectedOptions && r.selectedOptions.length > 0) {
          return { questionKey: r.questionKey, selectedOptions: r.selectedOptions };
        }
        if (typeof r.selectedOption === 'number' && r.selectedOption >= 0) {
          return { questionKey: r.questionKey, selectedOption: r.selectedOption };
        }
        if (typeof (r as any).selectedNumeric === 'number' && !Number.isNaN((r as any).selectedNumeric)) {
          return { questionKey: r.questionKey, selectedOption: (r as any).selectedNumeric };
        }
        return { questionKey: r.questionKey };
      });

      const multiRule = exam.multiCorrectRule === 'proportional' ? 'proportional' : 'all_or_nothing';
      const outcome = evaluateExamAttempt(evalQuestions, payloads, { multiRule });

      const syntheticAnswers: StudentAnswerPayload[] = attempt.responses.map((r) => ({
        questionId: r.questionKey,
        selectedOption: r.selectedOption,
        selectedOptions: r.selectedOptions,
        selectedNumeric: (r as any).selectedNumeric,
      }));
      const resultAnswers = buildResultAnswers(exam, syntheticAnswers, outcome.perQuestion);

      attempt.status =
        attempt.endsAt && new Date() > attempt.endsAt ? 'AUTO_SUBMITTED' : 'SUBMITTED';
      attempt.submittedAt = new Date();
      attempt.timeSpentMs = timeSpentMs;
      await attempt.save();

      const created = await ExamResult.create({
        examId: String(exam._id),
        examTitle: exam.title,
        studentId: req.user!.id,
        attemptId: attempt._id as mongoose.Types.ObjectId,
        score: Math.max(0, outcome.rawScore),
        totalMarks: outcome.maxScore,
        percentage: Math.round(outcome.percentage * 100) / 100,
        accuracy: outcome.accuracy,
        subjectBreakdown: outcome.subjectBreakdown.map((s) => ({
          subjectId: s.subjectId,
          rawScore: s.rawScore,
          maxScore: s.maxScore,
          correct: s.correct,
          attempted: s.attempted,
        })),
        timeSpentMs,
        evaluationVersion: 2,
        answers: resultAnswers,
        completedAt: new Date(),
      });

      const student = await Student.findById(req.user!.id).select('state city').lean();
      await leaderboardService.syncFromEvaluation(
        exam._id as mongoose.Types.ObjectId,
        req.user!.id as unknown as mongoose.Types.ObjectId,
        created.completedAt,
        timeSpentMs || 0,
        outcome,
        student as any
      );
      const globalEntry = await LeaderboardEntry.findOne({
        examId: exam._id as mongoose.Types.ObjectId,
        scope: 'GLOBAL',
        scopeKey: 'ALL',
        studentId: req.user!.id as unknown as mongoose.Types.ObjectId,
      }).lean();

      res.status(201).json({
        success: true,
        message: 'Exam submitted successfully',
        data: {
          attempt,
          result: {
            ...created.toObject(),
            percentile: globalEntry?.percentile,
            overallRank: globalEntry?.rank,
            attemptedAllowed: {
              attempted: outcome.accuracy.attempted,
              allowed: (exam as any).maxAttempts || exam.questions.length,
            },
          },
        },
      });
    } catch (error: any) {
      logger.error('Submit attempt error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const examId = String(req.params.examId);
      const scope = (req.query.scope as LeaderboardScope) || 'GLOBAL';
      const scopeKey = (req.query.scopeKey as string) || 'ALL';
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));

      const data = await leaderboardService.getLeaderboard(examId, scope, scopeKey, page, limit);
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getMyLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const examId = String(req.params.examId);
      const scope = (req.query.scope as LeaderboardScope) || 'GLOBAL';
      const scopeKey = (req.query.scopeKey as string) || 'ALL';

      const entry = await leaderboardService.getMyEntry(
        examId,
        String(req.user!.id),
        scope,
        scopeKey
      );
      res.json({ success: true, data: entry });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

export const studentExamsController = new StudentExamsController();
