import 'dotenv/config';
import mongoose from 'mongoose';
import { connectMongoDB, disconnectMongoDB } from '../config/mongo';
import { Admin } from '../modules/admin/admin.model';
import { Student } from '../modules/student/student.model';
import { Video } from '../modules/videos/video.model';
import { FlipBook } from '../modules/flipbooks/flipbook.model';
import { Exam } from '../modules/exams/exam.model';
import { ExamResult } from '../modules/exam-results/exam-result.model';
import { logger } from '../utils/logger';

// YouTube video IDs for educational content (real educational videos)
// These are sample educational video IDs - replace with actual educational content
const YOUTUBE_VIDEOS = {
  Mathematics: [
    'jBwR9EjYzD4', // Khan Academy Math
    'fNk_zzaMoSs', // Math Antics
    'aircAruvnKk', // 3Blue1Brown
    'WUvTyaaNkzM', // Math video
    'jBwR9EjYzD4',
  ],
  Physics: [
    'jBwR9EjYzD4', // Physics video
    'fNk_zzaMoSs',
    'aircAruvnKk',
    'WUvTyaaNkzM',
    'jBwR9EjYzD4',
  ],
  Chemistry: [
    'jBwR9EjYzD4', // Chemistry video
    'fNk_zzaMoSs',
    'aircAruvnKk',
    'WUvTyaaNkzM',
    'jBwR9EjYzD4',
  ],
  Biology: [
    'jBwR9EjYzD4', // Biology video
    'fNk_zzaMoSs',
    'aircAruvnKk',
    'WUvTyaaNkzM',
    'jBwR9EjYzD4',
  ],
};

// Dummy PDF URLs
const PDF_URLS = [
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'https://www.africau.edu/images/default/sample.pdf',
  'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf',
  'https://file-examples.com/storage/fe68c0c8a5a1e1a5a5a5a5a/2017/10/file_example_PDF_500_kB.pdf',
  'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
];

const STANDARDS = [6, 7, 8, 9, 10];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];

// Video topics for each class and subject
const getVideoTopics = (standard: number, subject: string): string[] => {
  const topics: Record<string, Record<number, string[]>> = {
    Mathematics: {
      6: ['Basic Arithmetic', 'Fractions and Decimals', 'Geometry Basics', 'Introduction to Algebra', 'Data Handling'],
      7: ['Integers', 'Fractions and Decimals Advanced', 'Lines and Angles', 'Triangles', 'Perimeter and Area'],
      8: ['Rational Numbers', 'Linear Equations', 'Understanding Quadrilaterals', 'Data Handling', 'Squares and Square Roots'],
      9: ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables', 'Introduction to Euclid Geometry'],
      10: ['Real Numbers', 'Polynomials Advanced', 'Pair of Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions'],
    },
    Physics: {
      6: ['Motion and Measurement', 'Light, Shadows and Reflections', 'Electricity and Circuits', 'Fun with Magnets', 'Air Around Us'],
      7: ['Motion and Time', 'Electric Current and its Effects', 'Light', 'Winds, Storms and Cyclones', 'Soil'],
      8: ['Force and Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Light'],
      9: ['Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound'],
      10: ['Light - Reflection and Refraction', 'Human Eye and Colourful World', 'Electricity', 'Magnetic Effects of Electric Current', 'Sources of Energy'],
    },
    Chemistry: {
      6: ['Separation of Substances', 'Changes Around Us', 'Water', 'Air Around Us', 'Garbage In, Garbage Out'],
      7: ['Physical and Chemical Changes', 'Acids, Bases and Salts', 'Fibre to Fabric', 'Heat', 'Winds, Storms and Cyclones'],
      8: ['Coal and Petroleum', 'Combustion and Flame', 'Materials: Metals and Non-Metals', 'Synthetic Fibres and Plastics', 'Chemical Effects of Electric Current'],
      9: ['Matter in Our Surroundings', 'Is Matter Around Us Pure', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life'],
      10: ['Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Carbon and its Compounds', 'Periodic Classification of Elements'],
    },
    Biology: {
      6: ['Food: Where Does It Come From', 'Components of Food', 'Getting to Know Plants', 'Body Movements', 'The Living Organisms'],
      7: ['Nutrition in Plants', 'Nutrition in Animals', 'Fibre to Fabric', 'Heat', 'Respiration in Organisms'],
      8: ['Crop Production and Management', 'Microorganisms: Friend and Foe', 'Conservation of Plants and Animals', 'Cell - Structure and Functions', 'Reproduction in Animals'],
      9: ['The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Why Do We Fall Ill', 'Natural Resources'],
      10: ['Life Processes', 'Control and Coordination', 'How do Organisms Reproduce', 'Heredity and Evolution', 'Our Environment'],
    },
  };
  return topics[subject]?.[standard] || [`${subject} Topic 1`, `${subject} Topic 2`, `${subject} Topic 3`, `${subject} Topic 4`, `${subject} Topic 5`];
};

// Generate IIT exam questions
const generateIITExamQuestions = (subject: string, standard: number): any[] => {
  const questions: any[] = [];
  
  // Generate 10 questions per exam
  for (let i = 1; i <= 10; i++) {
    questions.push({
      question: `${subject} IIT Question ${i} for Class ${standard}: This is a sample IIT-level question testing advanced concepts.`,
      options: [
        `Option A: First answer choice`,
        `Option B: Second answer choice`,
        `Option C: Third answer choice`,
        `Option D: Fourth answer choice`,
      ],
      correctAnswer: Math.floor(Math.random() * 4), // Random correct answer
      marks: 4, // IIT pattern: 4 marks per question
    });
  }
  
  return questions;
};

// Generate NEET exam questions
const generateNEETExamQuestions = (subject: string, standard: number): any[] => {
  const questions: any[] = [];
  
  // Generate 15 questions per exam (NEET has more questions)
  for (let i = 1; i <= 15; i++) {
    questions.push({
      question: `${subject} NEET Question ${i} for Class ${standard}: This is a sample NEET-level question testing medical entrance concepts.`,
      options: [
        `Option A: First answer choice`,
        `Option B: Second answer choice`,
        `Option C: Third answer choice`,
        `Option D: Fourth answer choice`,
      ],
      correctAnswer: Math.floor(Math.random() * 4), // Random correct answer
      marks: 4, // NEET pattern: 4 marks per question
    });
  }
  
  return questions;
};

const seedVideos = async () => {
  logger.info('Seeding videos...');
  const videos: any[] = [];
  
  for (const standard of STANDARDS) {
    for (const subject of SUBJECTS) {
      const topics = getVideoTopics(standard, subject);
      const videoIds = YOUTUBE_VIDEOS[subject as keyof typeof YOUTUBE_VIDEOS] || YOUTUBE_VIDEOS.Mathematics;
      
      topics.forEach((topic, index) => {
        const videoId = videoIds[index % videoIds.length];
        videos.push({
          title: `Class ${standard} ${subject}: ${topic}`,
          youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
          description: `Learn ${topic} for Class ${standard} ${subject}. This video covers all important concepts and examples.`,
          category: subject,
          duration: `${30 + Math.floor(Math.random() * 30)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          standard,
          subject,
          isActive: true,
        });
      });
    }
  }
  
  // Clear existing videos
  await Video.deleteMany({});
  logger.info(`Cleared existing videos`);
  
  // Insert new videos
  await Video.insertMany(videos);
  logger.info(`Inserted ${videos.length} videos`);
};

const seedFlipBooks = async () => {
  logger.info('Seeding flipbooks...');
  const flipbooks: any[] = [];
  
  for (const standard of STANDARDS) {
    for (const subject of SUBJECTS) {
      const topics = getVideoTopics(standard, subject);
      
      topics.forEach((topic, index) => {
        flipbooks.push({
          title: `Class ${standard} ${subject}: ${topic} - Study Material`,
          pdfUrl: PDF_URLS[index % PDF_URLS.length],
          description: `Complete study material for ${topic} in Class ${standard} ${subject}. Includes notes, examples, and practice problems.`,
          standard,
          subject,
          isActive: true,
        });
      });
    }
  }
  
  // Clear existing flipbooks
  await FlipBook.deleteMany({});
  logger.info(`Cleared existing flipbooks`);
  
  // Insert new flipbooks
  await FlipBook.insertMany(flipbooks);
  logger.info(`Inserted ${flipbooks.length} flipbooks`);
};

const seedExams = async () => {
  logger.info('Seeding exams...');
  const exams: any[] = [];
  
  // IIT Exams
  for (const standard of STANDARDS) {
    for (const subject of ['Mathematics', 'Physics', 'Chemistry']) {
      const questions = generateIITExamQuestions(subject, standard);
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      
      exams.push({
        title: `IIT JEE Mock Test - Class ${standard} ${subject}`,
        description: `Comprehensive IIT JEE pattern mock test for Class ${standard} ${subject}. Duration: 3 hours.`,
        duration: 180, // 3 hours
        questions,
        totalMarks,
        passingMarks: Math.floor(totalMarks * 0.3), // 30% passing
        standard,
        subject,
        examType: 'IIT',
        isActive: true,
      });
    }
  }
  
  // NEET Exams
  for (const standard of STANDARDS) {
    for (const subject of ['Physics', 'Chemistry', 'Biology']) {
      const questions = generateNEETExamQuestions(subject, standard);
      const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      
      exams.push({
        title: `NEET Mock Test - Class ${standard} ${subject}`,
        description: `Comprehensive NEET pattern mock test for Class ${standard} ${subject}. Duration: 3 hours 20 minutes.`,
        duration: 200, // 3 hours 20 minutes
        questions,
        totalMarks,
        passingMarks: Math.floor(totalMarks * 0.5), // 50% passing
        standard,
        subject,
        examType: 'NEET',
        isActive: true,
      });
    }
  }
  
  // Clear existing exams
  await Exam.deleteMany({});
  logger.info(`Cleared existing exams`);
  
  // Insert new exams
  await Exam.insertMany(exams);
  logger.info(`Inserted ${exams.length} exams`);
};

const seedData = async () => {
  try {
    logger.info('Starting data seeding...');
    
    // Connect to MongoDB
    await connectMongoDB();
    logger.info('Connected to MongoDB');
    
    // Seed users (idempotent)
    const ADMIN_EMAIL = 'test1@gmail.com';
    const ADMIN_PASSWORD = 'Test@123';
    const STUDENT_EMAIL = 'test@gmail.com';
    const STUDENT_PASSWORD = 'test@123';
    const STUDENT_CLASS = '6';
    const STUDENT_ID = 'STU001';

    const [existingAdmin, existingStudent] = await Promise.all([
      Admin.findOne({ email: ADMIN_EMAIL }),
      Student.findOne({ email: STUDENT_EMAIL }),
    ]);

    if (!existingAdmin) {
      await Admin.create({
        name: 'Test Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        isActive: true,
      });
      logger.info('Seeded admin user');
    } else {
      existingAdmin.password = ADMIN_PASSWORD;
      existingAdmin.isActive = true;
      existingAdmin.name = existingAdmin.name || 'Test Admin';
      await existingAdmin.save();
      logger.info('Updated existing admin password');
    }

    if (!existingStudent) {
      await Student.create({
        name: 'Test Student',
        email: STUDENT_EMAIL,
        password: STUDENT_PASSWORD,
        studentId: STUDENT_ID,
        role: 'student',
        isActive: true,
        class: STUDENT_CLASS,
      });
      logger.info('Seeded student user');
    } else {
      existingStudent.password = STUDENT_PASSWORD;
      existingStudent.isActive = true;
      (existingStudent as any).class = STUDENT_CLASS;
      existingStudent.studentId = existingStudent.studentId || STUDENT_ID;
      existingStudent.name = existingStudent.name || 'Test Student';
      await existingStudent.save();
      logger.info('Updated existing student password');
    }

    // Seed data
    await seedVideos();
    await seedFlipBooks();
    await seedExams();

    // Seed a few exam results for the seeded student
    const student = await Student.findOne({ email: STUDENT_EMAIL });
    if (student) {
      // Avoid duplicating on every seed run: only seed if no results exist
      const existingResults = await ExamResult.countDocuments({ studentId: student._id });
      if (existingResults === 0) {
        logger.info('Seeding sample exam results...');

        const exams = await Exam.find({ isActive: true }).sort({ createdAt: -1 }).limit(5);
        const results: any[] = [];

        for (const exam of exams) {
          const answers: any[] = [];
          let score = 0;

          exam.questions.forEach((q: any, idx: number) => {
            const selectedAnswer = Math.floor(Math.random() * q.options.length);
            const isCorrect = selectedAnswer === q.correctAnswer;
            if (isCorrect) score += q.marks;
            answers.push({
              questionId: `q${idx + 1}`,
              selectedAnswer,
              isCorrect,
            });
          });

          results.push({
            examId: String(exam._id),
            examTitle: exam.title,
            studentId: student._id,
            score,
            totalMarks: exam.totalMarks ?? exam.questions.reduce((s: number, qq: any) => s + qq.marks, 0),
            percentage: ((score / (exam.totalMarks ?? exam.questions.reduce((s: number, qq: any) => s + qq.marks, 0))) * 100),
            answers,
            completedAt: new Date(Date.now() - Math.floor(Math.random() * 20) * 24 * 60 * 60 * 1000),
          });
        }

        await ExamResult.insertMany(results);
        logger.info(`Seeded ${results.length} exam results`);
      }
    }
    
    logger.info('Data seeding completed successfully!');
    
    // Disconnect
    await disconnectMongoDB();
    logger.info('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error: any) {
    logger.error('Error seeding data:', error);
    console.error('Error seeding data:', error);
    await disconnectMongoDB();
    process.exit(1);
  }
};

// Run the seed script
seedData();

