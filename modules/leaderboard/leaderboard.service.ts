import mongoose from 'mongoose';
import { LeaderboardEntry, LeaderboardScope } from './leaderboard.model';
import { EvaluationOutcome } from '../exams/exam-evaluation.service';
import { IStudent } from '../student/student.model';

function accuracyRatio(out: EvaluationOutcome): number {
  const { correct, attempted } = out.accuracy;
  if (attempted <= 0) return 0;
  return correct / attempted;
}

export function regionScopeKey(student: Pick<IStudent, 'state' | 'city'> | null): string {
  if (!student?.state && !student?.city) return 'UNKNOWN';
  const s = (student.state || '').trim().toUpperCase().replace(/\s+/g, '-');
  const c = (student.city || '').trim().toUpperCase().replace(/\s+/g, '-');
  return [s, c].filter(Boolean).join('|') || 'UNKNOWN';
}

export class LeaderboardService {
  /**
   * Upserts leaderboard rows for GLOBAL, per-subject, and regional scope.
   */
  async syncFromEvaluation(
    examId: mongoose.Types.ObjectId,
    studentId: mongoose.Types.ObjectId,
    submittedAt: Date,
    timeSpentMs: number,
    out: EvaluationOutcome,
    student: Pick<IStudent, 'state' | 'city'> | null
  ): Promise<void> {
    const acc = accuracyRatio(out);
    const maxScore = out.maxScore;

    const base = {
      score: out.rawScore,
      maxScore,
      accuracy: acc,
      timeSpentMs: timeSpentMs || 0,
      submittedAt,
    };

    await LeaderboardEntry.findOneAndUpdate(
      { examId, scope: 'GLOBAL' as LeaderboardScope, scopeKey: 'ALL', studentId },
      { $set: { ...base, rank: 1 } },
      { upsert: true, new: true }
    );

    for (const row of out.subjectBreakdown) {
      if (!row.subjectId || row.subjectId === 'GENERAL') continue;
      const subAcc = row.attempted > 0 ? row.correct / row.attempted : 0;
      await LeaderboardEntry.findOneAndUpdate(
        {
          examId,
          scope: 'SUBJECT' as LeaderboardScope,
          scopeKey: row.subjectId,
          studentId,
        },
        {
          $set: {
            score: row.rawScore,
            maxScore: row.maxScore,
            accuracy: subAcc,
            timeSpentMs: timeSpentMs || 0,
            submittedAt,
            rank: 1,
          },
        },
        { upsert: true, new: true }
      );
    }

    const rk = regionScopeKey(student);
    await LeaderboardEntry.findOneAndUpdate(
      { examId, scope: 'REGION' as LeaderboardScope, scopeKey: rk, studentId },
      { $set: { ...base, rank: 1 } },
      { upsert: true, new: true }
    );

    await this.recomputeRanks(examId, 'GLOBAL', 'ALL');
    await this.recomputeRanks(examId, 'REGION', rk);
    const subjects = new Set(out.subjectBreakdown.map((s) => s.subjectId).filter(Boolean));
    for (const sid of subjects) {
      if (sid === 'GENERAL') continue;
      await this.recomputeRanks(examId, 'SUBJECT', sid);
    }
  }

  /**
   * Competition ranking: same score → same rank; next rank skips.
   */
  async recomputeRanks(
    examId: mongoose.Types.ObjectId,
    scope: LeaderboardScope,
    scopeKey: string
  ): Promise<void> {
    const rows = await LeaderboardEntry.find({ examId, scope, scopeKey })
      .sort({
        score: -1,
        accuracy: -1,
        timeSpentMs: 1,
        submittedAt: 1,
      })
      .lean()
      .exec();

    const total = rows.length;

    const bulk: any[] = [];
    let prevTieKey = '';
    let currentRank = 1;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const tieKey = `${r.score}|${r.accuracy}|${r.timeSpentMs}|${new Date(r.submittedAt).getTime()}`;
      if (i === 0) {
        currentRank = 1;
      } else if (tieKey !== prevTieKey) {
        currentRank = i + 1;
      }
      prevTieKey = tieKey;

      const percentile =
        total > 1
          ? Math.round(((total - currentRank) / (total - 1)) * 10000) / 100
          : 100;

      bulk.push({
        updateOne: {
          filter: { _id: r._id },
          update: { $set: { rank: currentRank, percentile } },
        },
      });
    }

    if (bulk.length > 0) {
      await LeaderboardEntry.bulkWrite(bulk, { ordered: false });
    }
  }

  async getLeaderboard(
    examId: string,
    scope: LeaderboardScope,
    scopeKey: string,
    page: number,
    limit: number
  ) {
    const skip = Math.max(0, (page - 1) * limit);
    const [items, total] = await Promise.all([
      LeaderboardEntry.find({
        examId: new mongoose.Types.ObjectId(examId),
        scope,
        scopeKey,
      })
        .sort({ rank: 1 })
        .skip(skip)
        .limit(limit)
        .populate('studentId', 'name email studentId state city institution')
        .lean(),
      LeaderboardEntry.countDocuments({
        examId: new mongoose.Types.ObjectId(examId),
        scope,
        scopeKey,
      }),
    ]);
    return { items, total, page, limit };
  }

  async getMyEntry(
    examId: string,
    studentId: string,
    scope: LeaderboardScope,
    scopeKey: string
  ) {
    return LeaderboardEntry.findOne({
      examId: new mongoose.Types.ObjectId(examId),
      scope,
      scopeKey,
      studentId: new mongoose.Types.ObjectId(studentId),
    }).lean();
  }
}

export const leaderboardService = new LeaderboardService();
