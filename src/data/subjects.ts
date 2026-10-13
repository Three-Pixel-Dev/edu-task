import { QUIZ } from '@/constants/app';
import type { Subject } from '@/types';

type SubjectSeed = Omit<Subject, 'id' | 'levelCount'>;

const seeds: SubjectSeed[] = [
  // Electronic & Hardware
  { fieldId: 'electronic-hardware', code: 'CEIT-2011', name: 'Digital Logic Design' },
  { fieldId: 'electronic-hardware', code: 'CEIT-2022', name: 'Electronic Circuits' },
  { fieldId: 'electronic-hardware', code: 'CEIT-3011', name: 'Computer Architecture' },
  { fieldId: 'electronic-hardware', code: 'CEIT-3032', name: 'Microprocessors & Interfacing' },
  { fieldId: 'electronic-hardware', code: 'CEIT-4041', name: 'Embedded Systems' },

  // Software
  { fieldId: 'software', code: 'CEIT-3021', name: 'Object-Oriented Programming' },
  { fieldId: 'software', code: 'CEIT-3042', name: 'Data Structures & Algorithms' },
  { fieldId: 'software', code: 'CEIT-4012', name: 'Software Engineering' },
  { fieldId: 'software', code: 'CEIT-4031', name: 'Database Management System' },
  { fieldId: 'software', code: 'CEIT-5051', name: 'Operating System' },
  { fieldId: 'software', code: 'CEIT-5013', name: 'Mobile Application Development' },

  // Network and Communication
  { fieldId: 'network-communication', code: 'CEIT-5012', name: 'Networking Fundamentals' },
  { fieldId: 'network-communication', code: 'CEIT-4062', name: 'Data Communication' },
  { fieldId: 'network-communication', code: 'CEIT-5022', name: 'Wireless & Mobile Networks' },
  { fieldId: 'network-communication', code: 'CEIT-5032', name: 'Network Administration' },

  // Security
  { fieldId: 'security', code: 'CEIT-5031', name: 'Information Security' },
  { fieldId: 'security', code: 'CEIT-5041', name: 'Cryptography' },
  { fieldId: 'security', code: 'CEIT-6011', name: 'Network Security' },

  // Data Science
  { fieldId: 'data-science', code: 'CEIT-3051', name: 'Probability & Statistics' },
  { fieldId: 'data-science', code: 'CEIT-4051', name: 'Data Mining' },
  { fieldId: 'data-science', code: 'CEIT-5061', name: 'Machine Learning' },
  { fieldId: 'data-science', code: 'CEIT-5071', name: 'Big Data Analytics' },

  // Signal Processing
  { fieldId: 'signal-processing', code: 'CEIT-4021', name: 'Signals & Systems' },
  { fieldId: 'signal-processing', code: 'CEIT-5081', name: 'Digital Signal Processing' },
  { fieldId: 'signal-processing', code: 'CEIT-6021', name: 'Digital Image Processing' },

  // Project Management & Practice
  { fieldId: 'project-management', code: 'CEIT-4071', name: 'Software Project Management' },
  { fieldId: 'project-management', code: 'CEIT-5091', name: 'Professional Ethics & Practice' },
  { fieldId: 'project-management', code: 'CEIT-6031', name: 'Engineering Project Practice' },
];

export const subjectIdFromCode = (code: string) => code.toLowerCase();

export const subjects: Subject[] = seeds.map((seed) => ({
  ...seed,
  id: subjectIdFromCode(seed.code),
  levelCount: QUIZ.levelCount,
}));
