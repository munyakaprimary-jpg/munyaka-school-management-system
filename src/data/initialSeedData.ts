export const buildDefaultClusters = () => {
  return [
    { id: 'cluster-1', name: 'Mathematics Activities', grade: 'Grade 1', learningAreas: ['Mathematics'] },
    { id: 'cluster-2', name: 'Language Activities', grade: 'Grade 1', learningAreas: ['English', 'Kiswahili'] }
  ];
};

export const initialSeedData = {
  version: "2.6.0",
  students: [],
  learners: [],
  staff: [
    {
      id: "MUN-0001",
      staffId: "MUN-0001",
      name: "JAMES NDIKI",
      role: "ICT Teacher",
      title: "ICT Teacher",
      systemRole: "teacher",
      email: "jndiki@munyaka.sc.ke",
      tempAccessCode: "MUN-9632",
      accessCode: "MUN-9632"
    },
    {
      id: "MUN-0002",
      staffId: "MUN-0002",
      name: "ANN NDUTA MBUGUA",
      role: "Class Teacher",
      title: "Class Teacher",
      systemRole: "teacher",
      email: "annmbugua@munyaka.sc.ke",
      tempAccessCode: "MUN-2647",
      accessCode: "MUN-2647"
    },
    {
      id: "MUN-0003",
      staffId: "MUN-0003",
      name: "JANET GATHONI KUNGU",
      role: "Library Teacher",
      title: "Library Teacher",
      systemRole: "teacher",
      email: "janetkungu@munyaka.sc.ke",
      tempAccessCode: "MUN-9020",
      accessCode: "MUN-9020"
    },
    {
      id: "MUN-0004",
      staffId: "MUN-0004",
      name: "LAWRENCE NDEGWA GIOSHE",
      role: "Subject Teacher",
      title: "Subject Teacher",
      systemRole: "teacher",
      email: "lndegwa@munyaka.sc.ke",
      tempAccessCode: "MUN-7496",
      accessCode: "MUN-7496"
    },
    {
      id: "MUN-0005",
      staffId: "MUN-0005",
      name: "ALICE MAINA",
      role: "Class Teacher",
      title: "Class Teacher",
      systemRole: "teacher",
      email: "maina@munyaka.sc.ke",
      tempAccessCode: "MUN-2116",
      accessCode: "MUN-2116"
    },
    {
      id: "MUN-0006",
      staffId: "MUN-0006",
      name: "HOGLA SANDUKI",
      role: "Class Teacher",
      title: "Class Teacher",
      systemRole: "teacher",
      email: "sanduki@munyaka.sc.ke",
      tempAccessCode: "MUN-7849",
      accessCode: "MUN-7849"
    }
  ],
  grades: ["PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
  streams: ["North", "South", "East", "West"],
  exams: [],
  fees: [],
  attendance: [],
  transactions: []
};

(initialSeedData as any).learners = [];
delete (initialSeedData as any).students;

export const INITIAL_SEED_DATA = initialSeedData;
export const SEED_VERSION = initialSeedData.version;
export const initialStaff = initialSeedData.staff;
export const initialStudents = [];
export const initialGrades = initialSeedData.grades;
export const initialStreams = initialSeedData.streams;
export const initialConfiguredStreams = initialSeedData.streams;

export default initialSeedData;
