import 'dotenv/config';
import { connectMongoDB, disconnectMongoDB } from '../config/mongo';
import { Exam } from '../modules/exams/exam.model';

const CORRECT = 4;
const NEGATIVE = -1;

type SectionBlueprint = {
  sectionId: string;
  sectionName: string;
  subjectKey: string;
  sectionType: 'A' | 'B';
  totalQuestions: number;
  maxAttempts: number;
  isOptional: boolean;
  competitiveType: 'MCQ' | 'NUMERICAL';
};

function createQuestion(index: number, section: SectionBlueprint) {
  const qk = `q${index}`;
  if (section.competitiveType === 'NUMERICAL') {
    return {
      questionKey: qk,
      question: `${section.subjectKey} numerical question ${index}`,
      options: ['0', '1'],
      competitiveType: 'NUMERICAL' as const,
      questionType: 'single' as const,
      correctNumericAnswer: (index % 20) + 1,
      correctAnswer: 0,
      marks: CORRECT,
      negativeMarks: NEGATIVE,
      subjectId: section.subjectKey,
      sectionId: section.sectionId,
      difficultyLevel: index % 3 === 0 ? 'hard' : index % 2 === 0 ? 'medium' : 'easy',
    };
  }
  return {
    questionKey: qk,
    question: `${section.subjectKey} MCQ question ${index}`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    competitiveType: 'MCQ' as const,
    questionType: 'single' as const,
    correctAnswer: index % 4,
    marks: CORRECT,
    negativeMarks: NEGATIVE,
    subjectId: section.subjectKey,
    sectionId: section.sectionId,
    difficultyLevel: index % 3 === 0 ? 'hard' : index % 2 === 0 ? 'medium' : 'easy',
  };
}

function buildExamPayload(
  testName: string,
  testType: 'NEET' | 'JEE',
  duration: number,
  maxAttempts: number,
  sections: SectionBlueprint[]
) {
  const questions: any[] = [];
  const sectionDocs: any[] = [];
  let idx = 1;
  for (const section of sections) {
    const ids: string[] = [];
    for (let i = 0; i < section.totalQuestions; i++) {
      questions.push(createQuestion(idx, section));
      ids.push(`q${idx}`);
      idx += 1;
    }
    sectionDocs.push({
      sectionId: section.sectionId,
      sectionName: section.sectionName,
      subjectKey: section.subjectKey,
      sectionType: section.sectionType,
      totalQuestions: section.totalQuestions,
      maxAttempts: section.maxAttempts,
      isOptional: section.isOptional,
      questionIds: ids,
      rules: {
        questionType: 'single',
        positiveMarks: CORRECT,
        negativeMarks: NEGATIVE,
      },
    });
  }

  return {
    title: testName,
    testName,
    testType,
    examType: testType === 'JEE' ? 'IIT' : 'NEET',
    standard: 6,
    duration,
    totalQuestions: questions.length,
    maxAttempts,
    examSchemaVersion: 2,
    markingDefaults: { correctMarks: CORRECT, wrongMarks: NEGATIVE },
    multiCorrectRule: 'all_or_nothing',
    questions,
    sections: sectionDocs,
    totalMarks: questions.reduce((s, q) => s + q.marks, 0),
    passingMarks: Math.round(questions.length * 1.2),
    isActive: true,
    description: `${testName} strict pattern seeded`,
  };
}

async function seedExam(payload: any) {
  const existing = await Exam.findOne({ testName: payload.testName });
  if (existing) {
    Object.assign(existing, payload);
    await existing.save();
    return existing;
  }
  return Exam.create(payload);
}

async function run() {
  const clear = process.argv.includes('--clear');
  await connectMongoDB();

  if (clear) {
    const allExams = await Exam.find({}).select('_id').lean();
    const examIds = allExams.map((e) => String(e._id));
    await Exam.deleteMany({});
    if (examIds.length > 0) {
      await (await import('../modules/exam-results/exam-result.model')).ExamResult.deleteMany({
        examId: { $in: examIds },
      });
      await (await import('../modules/leaderboard/leaderboard.model')).LeaderboardEntry.deleteMany({
        examId: { $in: allExams.map((e) => e._id) },
      });
    }
  }

  const neet = buildExamPayload('NEET Full Test 1', 'NEET', 200, 180, [
    { sectionId: 'PHY_A', sectionName: 'Physics - Section A', subjectKey: 'PHYSICS', sectionType: 'A', totalQuestions: 45, maxAttempts: 45, isOptional: false, competitiveType: 'MCQ' },
    { sectionId: 'PHY_B', sectionName: 'Physics - Section B', subjectKey: 'PHYSICS', sectionType: 'B', totalQuestions: 15, maxAttempts: 10, isOptional: true, competitiveType: 'MCQ' },
    { sectionId: 'CHE_A', sectionName: 'Chemistry - Section A', subjectKey: 'CHEMISTRY', sectionType: 'A', totalQuestions: 45, maxAttempts: 45, isOptional: false, competitiveType: 'MCQ' },
    { sectionId: 'CHE_B', sectionName: 'Chemistry - Section B', subjectKey: 'CHEMISTRY', sectionType: 'B', totalQuestions: 15, maxAttempts: 10, isOptional: true, competitiveType: 'MCQ' },
    { sectionId: 'BIO_A', sectionName: 'Biology - Section A', subjectKey: 'BIOLOGY', sectionType: 'A', totalQuestions: 90, maxAttempts: 90, isOptional: false, competitiveType: 'MCQ' },
    { sectionId: 'BIO_B', sectionName: 'Biology - Section B', subjectKey: 'BIOLOGY', sectionType: 'B', totalQuestions: 30, maxAttempts: 20, isOptional: true, competitiveType: 'MCQ' },
  ]);

  const jee = buildExamPayload('JEE Main Test 1', 'JEE', 180, 75, [
    { sectionId: 'PHY_A', sectionName: 'Physics - Section A', subjectKey: 'PHYSICS', sectionType: 'A', totalQuestions: 20, maxAttempts: 20, isOptional: false, competitiveType: 'MCQ' },
    { sectionId: 'PHY_B', sectionName: 'Physics - Section B (Attempt any 5)', subjectKey: 'PHYSICS', sectionType: 'B', totalQuestions: 10, maxAttempts: 5, isOptional: true, competitiveType: 'NUMERICAL' },
    { sectionId: 'CHE_A', sectionName: 'Chemistry - Section A', subjectKey: 'CHEMISTRY', sectionType: 'A', totalQuestions: 20, maxAttempts: 20, isOptional: false, competitiveType: 'MCQ' },
    { sectionId: 'CHE_B', sectionName: 'Chemistry - Section B (Attempt any 5)', subjectKey: 'CHEMISTRY', sectionType: 'B', totalQuestions: 10, maxAttempts: 5, isOptional: true, competitiveType: 'NUMERICAL' },
    { sectionId: 'MAT_A', sectionName: 'Mathematics - Section A', subjectKey: 'MATHEMATICS', sectionType: 'A', totalQuestions: 20, maxAttempts: 20, isOptional: false, competitiveType: 'MCQ' },
    { sectionId: 'MAT_B', sectionName: 'Mathematics - Section B (Attempt any 5)', subjectKey: 'MATHEMATICS', sectionType: 'B', totalQuestions: 10, maxAttempts: 5, isOptional: true, competitiveType: 'NUMERICAL' },
  ]);

  const neetDoc = await seedExam(neet);
  const jeeDoc = await seedExam(jee);

  console.log(JSON.stringify({
    seeded: [
      { id: String(neetDoc._id), name: neetDoc.testName, totalQuestions: neetDoc.questions.length, duration: neetDoc.duration, maxAttempts: (neetDoc as any).maxAttempts },
      { id: String(jeeDoc._id), name: jeeDoc.testName, totalQuestions: jeeDoc.questions.length, duration: jeeDoc.duration, maxAttempts: (jeeDoc as any).maxAttempts },
    ],
    sampleContract: {
      examName: 'NEET Full Test 1',
      duration: 200,
      totalQuestions: 200,
      maxAttempts: 180,
      sections: [
        { sectionName: 'Physics - Section A', totalQuestions: 45, maxAttempts: 45, sectionType: 'A', isOptional: false },
        { sectionName: 'Physics - Section B', totalQuestions: 15, maxAttempts: 10, sectionType: 'B', isOptional: true },
      ],
    },
  }, null, 2));

  await disconnectMongoDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await disconnectMongoDB();
  process.exit(1);
});
