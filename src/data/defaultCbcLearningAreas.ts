import { initialSeedData } from '@/data/initialSeedData';

export const comprehensiveCbcLearningAreas = [
  {
    id: 'sec_pp1_pp2',
    name: 'Pre-Primary (PP1 & PP2)',
    category: 'Pre-Primary',
    gradeLevel: 'Pre-Primary',
    learningAreas: [
      {
        id: 'la_lang_pp',
        name: 'Language Activities',
        code: 'LANG_PP',
        gradeLevel: 'Pre-Primary',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Listening, speaking, reading readiness, and writing readiness activities.',
        subStrands: ['Listening and Speaking', 'Reading Readiness', 'Writing Readiness'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_math_pp',
        name: 'Mathematical Activities',
        code: 'MATH_PP',
        gradeLevel: 'Pre-Primary',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Classification, matching, sorting, patterns, and number work.',
        subStrands: ['Classification', 'Sorting and Matching', 'Ordering', 'Number Concept'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_creative_pp',
        name: 'Creative Activities',
        code: 'CREATIVE_PP',
        gradeLevel: 'Pre-Primary',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Art, craft, music, movement, and dramatic play.',
        subStrands: ['Drawing and Coloring', 'Modeling', 'Singing and Rhythm', 'Movement'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_env_pp',
        name: 'Environmental Activities',
        code: 'ENV_PP',
        gradeLevel: 'Pre-Primary',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Exploring the immediate environment, plants, animals, and weather.',
        subStrands: ['Plants and Animals', 'Weather', 'Water and Soil', 'Safety'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_rel_pp',
        name: 'Religious Education',
        code: 'CRE_IRE_PP',
        gradeLevel: 'Pre-Primary',
        periodsPerWeek: 2,
        type: 'Core',
        description: 'Moral values, spiritual awareness, and good habits.',
        subStrands: ['Gods Creation', 'Good Behavior', 'Sharing and Caring'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      }
    ]
  },
  {
    id: 'sec_lower_primary',
    name: 'Lower Primary (Grades 1–3)',
    category: 'Lower Primary',
    gradeLevel: 'Grade 1-3',
    learningAreas: [
      {
        id: 'la_literacy',
        name: 'Literacy',
        code: 'LIT_1_3',
        gradeLevel: 'Lower Primary',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Foundational reading, writing, and language comprehension.',
        subStrands: ['Listening and Speaking', 'Reading', 'Writing', 'Grammar'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_kiswahili_ksl',
        name: 'Kiswahili / KSL',
        code: 'KIS_KSL',
        gradeLevel: 'Lower Primary',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Kiswahili language skills and Kenyan Sign Language.',
        subStrands: ['Kusikiliza na Kuzungumza', 'Kusoma', 'Kuandika'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_english',
        name: 'English',
        code: 'ENG_1_3',
        gradeLevel: 'Lower Primary',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'English language oral and written communication.',
        subStrands: ['Listening & Speaking', 'Reading & Comprehension', 'Guided Writing'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_mathematics',
        name: 'Mathematics',
        code: 'MATH_1_3',
        gradeLevel: 'Lower Primary',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Numbers, measurement, geometry, and data handling.',
        subStrands: ['Numbers & Arithmetic', 'Measurement (Length, Mass, Time)', 'Geometry', 'Handling Data'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_environmental_act',
        name: 'Environmental Activities',
        code: 'ENV_1_3',
        gradeLevel: 'Lower Primary',
        periodsPerWeek: 3,
        type: 'Core',
        description: 'Social and natural environment exploration.',
        subStrands: ['Our Environment', 'Weather and Sky', 'Plants and Animals', 'Water'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_hygiene_nutrition',
        name: 'Hygiene & Nutrition',
        code: 'HYG_NUTR',
        gradeLevel: 'Lower Primary',
        periodsPerWeek: 2,
        type: 'Core',
        description: 'Personal hygiene, sanitation, and healthy eating habits.',
        subStrands: ['Personal Hygiene', 'Healthy Foods', 'Safe Environment'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_religious_edu',
        name: 'Religious Education',
        code: 'RE_1_3',
        gradeLevel: 'Lower Primary',
        periodsPerWeek: 3,
        type: 'Core',
        description: 'Christian, Islamic, or Hindu Religious Education.',
        subStrands: ['Creation', 'The Life of Prophets/Jesus', 'Moral Values'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_creative_arts',
        name: 'Creative Arts',
        code: 'CA_1_3',
        gradeLevel: 'Lower Primary',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Art, Craft, and Music.',
        subStrands: ['Picture Making', 'Drawing', 'Singing Games', 'Percussion Instruments'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      }
    ]
  },
  {
    id: 'sec_upper_primary',
    name: 'Upper Primary (Grades 4–6)',
    category: 'Upper Primary',
    gradeLevel: 'Grade 4-6',
    learningAreas: [
      {
        id: 'la_english_up',
        name: 'English',
        code: 'ENG_4_6',
        gradeLevel: 'Upper Primary',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Advanced grammar, composition writing, and literary analysis.',
        subStrands: ['Listening & Speaking', 'Reading & Comprehension', 'Grammar in Use', 'Composition Writing'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_kiswahili_up',
        name: 'Kiswahili',
        code: 'KIS_4_6',
        gradeLevel: 'Upper Primary',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Ufahamu, sarufi, na uandishi wa Insha.',
        subStrands: ['Kusikiliza na Kuzungumza', 'Kusoma na Ufahamu', 'Sarufi', 'Kuandika Insha'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_mathematics_up',
        name: 'Mathematics',
        code: 'MATH_4_6',
        gradeLevel: 'Upper Primary',
        periodsPerWeek: 6,
        type: 'Core',
        description: 'Fractions, decimals, algebra basics, geometry, and statistics.',
        subStrands: ['Whole Numbers & Operations', 'Fractions & Decimals', 'Measurement', 'Geometry', 'Data Handling & Algebra'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_science_tech',
        name: 'Science & Technology',
        code: 'SCI_TECH_4_6',
        gradeLevel: 'Upper Primary',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Living things, environment, matter, force, and digital literacy.',
        subStrands: ['Living Things & Their Environment', 'Matter & Materials', 'Force & Energy', 'Computers & Digital Tech'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_social_studies',
        name: 'Social Studies',
        code: 'SOC_4_6',
        gradeLevel: 'Upper Primary',
        periodsPerWeek: 3,
        type: 'Core',
        description: 'Geography, history, citizenship, and governance in Kenya.',
        subStrands: ['Natural & Historic Environments', 'People & Population', 'Resources & Economic Activities', 'Governance & Citizenship'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_cre_ire_hre',
        name: 'Christian / Islamic / Hindu Religious Ed.',
        code: 'RE_4_6',
        gradeLevel: 'Upper Primary',
        periodsPerWeek: 3,
        type: 'Core',
        description: 'Religious teachings, ethics, and community service.',
        subStrands: ['The Bible/Quran/Vedas', 'Christian/Islamic Living', 'Morality and Ethics'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_creative_arts_sports',
        name: 'Creative Arts & Sports',
        code: 'CAS_4_6',
        gradeLevel: 'Upper Primary',
        periodsPerWeek: 3,
        type: 'Core',
        description: 'Visual arts, performing arts, physical education, and sports.',
        subStrands: ['Visual Arts & Crafts', 'Music & Drama', 'Physical Education & Games'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_agri_nutrition',
        name: 'Agriculture & Nutrition',
        code: 'AGRI_NUTR_4_6',
        gradeLevel: 'Upper Primary',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Crop production, domestic animal rearing, food preparation, and clothing.',
        subStrands: ['Crop Production', 'Domestic Animals', 'Food & Nutrition', 'Clothing & Textiles'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      }
    ]
  },
  {
    id: 'sec_junior_school',
    name: 'Junior School (Grades 7–9)',
    category: 'Junior School',
    gradeLevel: 'Grade 7-9',
    learningAreas: [
      {
        id: 'la_english_js',
        name: 'English',
        code: 'ENG_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Advanced literature, communication skills, and critical reading.',
        subStrands: ['Listening, Speaking & Phonology', 'Reading Comprehension & Literary Text', 'Grammar & Usage', 'Advanced Composition'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_kiswahili_js',
        name: 'Kiswahili',
        code: 'KIS_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Fasihi, sarufi ya juu, na uandishi wa kitaalamu.',
        subStrands: ['Kusikiliza, Kuzungumza na Mitindo', 'Kusoma na Fasihi', 'Sarufi na Matumizi ya Lugha', 'Uandishi Sanifu'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_mathematics_js',
        name: 'Mathematics',
        code: 'MATH_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Integers, algebra, coordinate geometry, statistics, and probability.',
        subStrands: ['Numbers, Integers & Real Numbers', 'Algebra & Equations', 'Geometry & Trigonometry', 'Statistics & Probability'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_integrated_science',
        name: 'Integrated Science',
        code: 'SCI_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 5,
        type: 'Core',
        description: 'Physics, chemistry, biology, and earth science.',
        subStrands: ['Scientific Investigation', 'Matter & Mixtures', 'Force, Work & Energy', 'Living Organisms & Health'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_social_studies_js',
        name: 'Social Studies',
        code: 'SOC_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 3,
        type: 'Core',
        description: 'World geography, African history, citizenship, and economics.',
        subStrands: ['Maps & Fieldwork', 'African History & Heritage', 'Resources & Economic Systems', 'Governance & Human Rights'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_religious_js',
        name: 'Religious Education (CRE / IRE / HRE)',
        code: 'RE_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 3,
        type: 'Core',
        description: 'Deepened spiritual study, ethics, and societal leadership.',
        subStrands: ['Scripture Study', 'Christian/Islamic Ethics', 'Church/Ummah History', 'Contemporary Moral Issues'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_pre_technical',
        name: 'Pre-Technical Studies',
        code: 'PRE_TECH_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Technical drawing, woodwork, metalwork, electricity, and ICT.',
        subStrands: ['Technical Drawing & Design', 'Tools, Materials & Workshop Safety', 'Basic Electricity & Electronics', 'Entrepreneurship Basics'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_agri_nutrition_js',
        name: 'Agriculture & Nutrition',
        code: 'AGRI_NUTR_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 4,
        type: 'Core',
        description: 'Agribusiness, food science, clothing construction, and home management.',
        subStrands: ['Agricultural Economics & Production', 'Food Science & Meal Planning', 'Clothing Construction & Care', 'Consumer Education'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      },
      {
        id: 'la_creative_arts_sports_js',
        name: 'Creative Arts & Sports',
        code: 'CAS_7_9',
        gradeLevel: 'Junior School',
        periodsPerWeek: 3,
        type: 'Core',
        description: 'Fine arts, design, music theory, and competitive sports.',
        subStrands: ['Advanced Visual Arts', 'Music Composition & Performance', 'Physical Education & Officiating', 'Sports Psychology & Safety'],
        assessmentRubrics: ['Exceeding Expectation', 'Meeting Expectation', 'Approaching Expectation', 'Below Expectation']
      }
    ]
  }
];

export const defaultCbcLearningAreas = comprehensiveCbcLearningAreas;
export default comprehensiveCbcLearningAreas;
