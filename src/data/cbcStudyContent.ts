// ─── CBC Study Content — Kenya Curriculum Grades 1–9 ─────────────────────────
// Each content card belongs to one strand. The StudyCorner page filters and
// searches across strands, sub-strands, and topics.

export type StrandCategory =
  | "CRE & Values"
  | "Languages"
  | "STEM & Agriculture"
  | "Social Studies & Arts"
  | "KICD Revision Bank"
  | "Assessments & Quizzes"
  // ── KICD Lower Primary (Grades 1–3) Learning Areas ────────────────────────
  | "Indigenous Language Activities"
  | "Kiswahili Language / Kenya Sign Language Activities"
  | "English Language Activities"
  | "Mathematical Activities"
  | "Environmental Activities"
  | "Hygiene and Nutrition Activities"
  | "Religious Education Activities"
  | "Movement and Creative Activities";

// ── KICD Lower Primary Learning Areas (exact names from KICD curriculum) ─────
export const LOWER_PRIMARY_LEARNING_AREAS: StrandCategory[] = [
  "Indigenous Language Activities",
  "Kiswahili Language / Kenya Sign Language Activities",
  "English Language Activities",
  "Mathematical Activities",
  "Environmental Activities",
  "Hygiene and Nutrition Activities",
  "Religious Education Activities",
  "Movement and Creative Activities",
];

export interface MemoryVerse {
  reference: string;
  text: string;
}

export interface RevisionQuestion {
  question: string;
  answer: string;
  rubric?: string;
}

/** Offline-capable file attachment stored as a Base64 data URL. */
export interface Attachment {
  name: string;
  /** MIME type, e.g. "application/pdf" or "image/png" */
  type: string;
  /** File size in bytes */
  size: number;
  /** Base64 data URL — self-contained, works offline with no server */
  dataUrl: string;
}

export interface ContentItem {
  id: string;
  grade: number; // 1–9
  strand: StrandCategory;
  subStrand: string;
  topic: string;
  summary: string;           // short preview shown on the card
  notes: string[];           // bullet points for the reader modal
  memoryVerses?: MemoryVerse[];
  revisionQuestions?: RevisionQuestion[];
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  /** Optional offline attachment — stored as Base64 so no server required */
  attachment?: Attachment;
  /** Optional marking scheme / answer key attachment (PDF or text) */
  markingScheme?: Attachment;
  /** Assessment-only: type of test/quiz/exam */
  assessmentType?: AssessmentType;
  /** Assessment-only: total marks */
  totalMarks?: number;
  /** Assessment-only: duration in minutes */
  durationMinutes?: number;
}

export type AssessmentType =
  | "Topical Quiz"
  | "CAT (Continuous Assessment Test)"
  | "Mid-Term Exam"
  | "End of Term Exam"
  | "Revision Paper"
  | "KNEC Sample Paper"
  | "Mock Exam"
  | "Opener Quiz"
  | "Other";

export const assessmentTypeOptions: AssessmentType[] = [
  "Topical Quiz",
  "CAT (Continuous Assessment Test)",
  "Mid-Term Exam",
  "End of Term Exam",
  "Revision Paper",
  "KNEC Sample Paper",
  "Mock Exam",
  "Opener Quiz",
  "Other",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const g = (grade: number) => grade;

// ─── CRE & Values ─────────────────────────────────────────────────────────────
const creValues: ContentItem[] = [
  // Grade 1
  {
    id: "cre-1-bible-reader",
    grade: g(1),
    strand: "CRE & Values",
    subStrand: "Bible Reader",
    topic: "Creation Story",
    summary: "God creates the world in six days and rests on the seventh.",
    notes: [
      "God created light and separated it from darkness on Day 1.",
      "God created the sky and waters on Day 2.",
      "God created land, plants, and trees on Day 3.",
      "God created the sun, moon, and stars on Day 4.",
      "God created sea creatures and birds on Day 5.",
      "God created animals and human beings on Day 6.",
      "God rested on the seventh day — this is why we rest on Sunday.",
    ],
    memoryVerses: [
      { reference: "Genesis 1:1", text: "In the beginning God created the heavens and the earth." },
    ],
    revisionQuestions: [
      { question: "How many days did God take to create the world?", answer: "Six days", rubric: "1 mark" },
      { question: "What did God create on the first day?", answer: "Light", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["creation", "genesis", "days", "rest"],
  },
  {
    id: "cre-1-moral-parables",
    grade: g(1),
    strand: "CRE & Values",
    subStrand: "Moral Parables",
    topic: "The Good Samaritan",
    summary: "Jesus tells the story of a man who helped a stranger in need.",
    notes: [
      "A man was travelling from Jerusalem to Jericho.",
      "He was attacked by robbers and left hurt by the roadside.",
      "A priest passed by but did not help.",
      "A Levite also passed by and ignored the man.",
      "A Samaritan (someone from a different community) stopped and helped.",
      "He bandaged the man's wounds and took him to an inn.",
      "Jesus said: 'Go and do likewise' — help anyone in need.",
    ],
    memoryVerses: [
      { reference: "Luke 10:27", text: "Love your neighbour as yourself." },
    ],
    revisionQuestions: [
      { question: "Who helped the hurt man on the road?", answer: "A Samaritan", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["samaritan", "love", "neighbour", "parable"],
  },
  // Grade 3
  {
    id: "cre-3-bible-reader",
    grade: g(3),
    strand: "CRE & Values",
    subStrand: "Bible Reader",
    topic: "The Life of Moses",
    summary: "Moses was called by God to lead the Israelites out of Egypt.",
    notes: [
      "Moses was born during a time when Hebrew babies were in danger.",
      "His mother placed him in a basket in the river Nile.",
      "Pharaoh's daughter found him and raised him as her own.",
      "As an adult, Moses saw an Egyptian beating a Hebrew and killed him.",
      "He fled to Midian where he became a shepherd.",
      "God called Moses from the burning bush at Mount Horeb.",
      "God gave Moses the Ten Commandments on Mount Sinai.",
    ],
    memoryVerses: [
      { reference: "Exodus 3:14", text: "I AM WHO I AM." },
    ],
    revisionQuestions: [
      { question: "Where did God speak to Moses?", answer: "From a burning bush on Mount Horeb", rubric: "2 marks" },
    ],
    difficulty: "intermediate",
    tags: ["moses", "egypt", "ten commandments", "exodus"],
  },
  // Grade 5
  {
    id: "cre-5-values",
    grade: g(5),
    strand: "CRE & Values",
    subStrand: "Values Education",
    topic: "Responsibility and Service",
    summary: "Christians are called to serve others with love and responsibility.",
    notes: [
      "Responsibility means doing what we are supposed to do without being told.",
      "Every person has responsibilities at home, school, and in the community.",
      "Jesus taught that serving others is like serving God.",
      "The parable of the Talents teaches us to use our gifts responsibly.",
      "Being responsible builds trust and respect with others.",
      "Examples of responsible behaviour: completing homework, caring for younger siblings.",
    ],
    memoryVerses: [
      { reference: "Galatians 5:13", text: "Serve one another humbly in love." },
    ],
    revisionQuestions: [
      { question: "What does responsibility mean?", answer: "Doing what we are supposed to do without being told", rubric: "2 marks" },
      { question: "Give two examples of responsible behaviour.", answer: "Completing homework; caring for younger siblings", rubric: "2 marks" },
    ],
    difficulty: "intermediate",
    tags: ["responsibility", "service", "values", "talents"],
  },
  // Grade 7
  {
    id: "cre-7-bible-reader",
    grade: g(7),
    strand: "CRE & Values",
    subStrand: "Bible Reader",
    topic: "The Prophets of Israel",
    summary: "God sent prophets to guide and warn the people of Israel.",
    notes: [
      "Prophets were messengers sent by God to speak on His behalf.",
      "Key prophets: Elijah, Elisha, Isaiah, Jeremiah, and Amos.",
      "Elijah challenged the prophets of Baal on Mount Carmel.",
      "Elisha performed many miracles, including healing Naaman.",
      "Prophets warned the people against sin and encouraged them to turn back to God.",
      "Their messages often included both a warning and a promise of hope.",
      "Christians today recognise the prophetic tradition fulfilled in Jesus.",
    ],
    memoryVerses: [
      { reference: "Jeremiah 1:9", text: "I have put my words in your mouth." },
    ],
    revisionQuestions: [
      { question: "Name two prophets of Israel.", answer: "Elijah, Elisha, Isaiah, Jeremiah, or Amos (any two)", rubric: "2 marks" },
    ],
    difficulty: "advanced",
    tags: ["prophets", "elijah", "elisha", "israel"],
  },
  // Grade 9
  {
    id: "cre-9-creed",
    grade: g(9),
    strand: "CRE & Values",
    subStrand: "Christian Doctrine",
    topic: "The Apostle's Creed",
    summary: "The Apostle's Creed expresses core beliefs shared by most Christian churches.",
    notes: [
      "The Apostle's Creed is one of the oldest statements of Christian faith.",
      "It affirms belief in God the Father Almighty, creator of heaven and earth.",
      "It affirms belief in Jesus Christ, God's only Son, our Lord.",
      "It affirms belief in the Holy Spirit, the holy catholic church.",
      "It affirms belief in the resurrection of the dead and life everlasting.",
      "Christians in Kenya of all denominations use the Creed in worship.",
      "The Creed unites believers across different traditions.",
    ],
    memoryVerses: [
      { reference: "1 Corinthians 15:3–4", text: "Christ died for our sins ... He was buried, He was raised on the third day." },
    ],
    revisionQuestions: [
      { question: "What does the Apostle's Creed teach about Jesus?", answer: "That He is God's only Son, our Lord, who died and rose again", rubric: "3 marks" },
    ],
    difficulty: "advanced",
    tags: ["creed", "doctrine", "resurrection", "faith"],
  },
];

// ─── Languages ───────────────────────────────────────────────────────────────
const languages: ContentItem[] = [
  // Grade 1 — English
  {
    id: "lang-1-english-vocab",
    grade: g(1),
    strand: "Languages",
    subStrand: "English",
    topic: "Colour and Number Vocabulary",
    summary: "Learn to name colours and count objects in English.",
    notes: [
      "Colours: red, blue, yellow, green, orange, purple, pink, brown, black, white.",
      "Numbers 1–10: one, two, three, four, five, six, seven, eight, nine, ten.",
      "Use colours and numbers together: 'I have three red apples.'",
      "Practice naming the colour of objects in your classroom.",
      "Sing number songs to help remember the order of numbers.",
    ],
    revisionQuestions: [
      { question: "How do you spell the colour of the sky?", answer: "Blue", rubric: "1 mark" },
      { question: "Write numbers 1–5 in words.", answer: "One, two, three, four, five", rubric: "2 marks" },
    ],
    difficulty: "beginner",
    tags: ["english", "vocabulary", "colours", "numbers"],
  },
  // Grade 2 — Kiswahili
  {
    id: "lang-2-kiswahili-grammar",
    grade: g(2),
    strand: "Languages",
    subStrand: "Kiswahili",
    topic: "Kiswahili Grammar: Nouns and Pronouns",
    summary: "Learn how nouns and pronouns work in Kiswahili.",
    notes: [
      "A noun is a name of a person, place, animal, or thing.",
      "Examples: mtoto (child), nyumba (house), mbwa (dog),agua (water).",
      "Pronouns replace nouns: mimi (I/me), wewe (you), yeye (he/she), sisi (we), ninyi (you plural), wao (they).",
      "Adjectives describe nouns: mtoto mdogo (small child), nyumba kubwa (big house).",
      "Use adjectives after the noun in Swahili sentence structure.",
    ],
    revisionQuestions: [
      { question: "What is a noun?", answer: "A name of a person, place, animal, or thing", rubric: "1 mark" },
      { question: "Translate: 'I am a child' into Kiswahili.", answer: "Mimi ni mtoto", rubric: "2 marks" },
    ],
    difficulty: "beginner",
    tags: ["kiswahili", "grammar", "nouns", "pronouns"],
  },
  // Grade 4 — English Composition
  {
    id: "lang-4-english-composition",
    grade: g(4),
    strand: "Languages",
    subStrand: "English",
    topic: "Writing a Narrative Paragraph",
    summary: "Learn the structure of a good narrative paragraph with beginning, middle, and end.",
    notes: [
      "A narrative paragraph tells a story about something that happened.",
      "It has three parts: beginning (introduction), middle (events), end (conclusion).",
      "Use time sequence words: first, next, then, after that, finally.",
      "Use descriptive words to make the story interesting.",
      "Example topic sentence: 'Last Saturday, I visited my grandmother in the village.'",
      "Include feelings and emotions in your story.",
    ],
    revisionQuestions: [
      { question: "What are the three parts of a narrative paragraph?", answer: "Beginning, middle, and end", rubric: "2 marks" },
      { question: "Give two examples of time sequence words.", answer: "First, next, then, after that, finally (any two)", rubric: "2 marks" },
    ],
    difficulty: "intermediate",
    tags: ["english", "composition", "narrative", "writing"],
  },
  // Grade 6 — Kiswahili
  {
    id: "lang-6-kiswahili-composition",
    grade: g(6),
    strand: "Languages",
    subStrand: "Kiswahili",
    topic: "Kuandika Insha ya Maelezo",
    summary: "Write a descriptive essay (insha ya maelezo) in Kiswahili.",
    notes: [
      "Insha ya maelezo huwa inaelezea mtu, mahali, au kitu kwa undani.",
      "Muundo: utangulizi, mwili, hitimisho.",
      "Tumia sentensi fupi na wazi kuelezea.",
      "Jumla ya maneno: angalau maneno 200–300.",
      "Mifano ya mada: 'Shule Yangu', 'Kijiji Changu', 'Mtu Wangu Wa kwanza'.",
      "itumie misamiati mipya uliyojifunza.",
    ],
    revisionQuestions: [
      { question: "Je. Insha ya maelezo ina sehemu ngapi? Zitaje.", answer: "Ina sehemu tatu: utangulizi, mwili, hitimisho", rubric: "3 marks" },
    ],
    difficulty: "intermediate",
    tags: ["kiswahili", "insha", "maelezo", "composition"],
  },
  // Grade 8 — English
  {
    id: "lang-8-english-grammar",
    grade: g(8),
    strand: "Languages",
    subStrand: "English",
    topic: "Tenses: Past, Present, and Future Perfect",
    summary: "Master the perfect tenses to describe completed actions.",
    notes: [
      "Present Perfect: 'I have finished my homework.' (action completed, relevance to now).",
      "Past Perfect: 'I had finished my homework before the teacher came.' (earlier past).",
      "Future Perfect: 'I will have finished my homework by 6 pm.' (completed by a future time).",
      "Time markers: already, yet, just, for, since, by the time.",
      "Form: had + past participle (Past Perfect); will have + past participle (Future Perfect).",
      "Common error: do not use 'have' and 'had' together.",
    ],
    revisionQuestions: [
      { question: "Rewrite using the Past Perfect: 'She cooked dinner. Then the guests arrived.'", answer: "She had cooked dinner before the guests arrived.", rubric: "2 marks" },
    ],
    difficulty: "advanced",
    tags: ["english", "grammar", "tenses", "perfect"],
  },
];

// ─── STEM & Agriculture ───────────────────────────────────────────────────────
const stemAgriculture: ContentItem[] = [
  // Grade 1 — Math
  {
    id: "stem-1-math-tables",
    grade: g(1),
    strand: "STEM & Agriculture",
    subStrand: "Mathematics",
    topic: "Addition Tables 1–5",
    summary: "Practice addition facts for numbers 1 through 5.",
    notes: [
      "Addition combines two groups to make a bigger group.",
      "The sign for addition is '+' (plus).",
      "The answer is called the 'sum'.",
      "Practice: 1+1=2, 1+2=3, 1+3=4, 1+4=5, 1+5=6.",
      "Practice: 2+1=3, 2+2=4, 2+3=5, 2+4=6, 2+5=7.",
      "Practice: 3+1=4, 3+2=5, 3+3=6, 3+4=7, 3+5=8.",
      "Use objects (counters, sticks) to visualise addition.",
    ],
    revisionQuestions: [
      { question: "Calculate: 2 + 3 = ?", answer: "5", rubric: "1 mark" },
      { question: "What is 4 + 1?", answer: "5", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["math", "addition", "tables", "numbers"],
  },
  // Grade 3 — Science
  {
    id: "stem-3-science-diagrams",
    grade: g(3),
    strand: "STEM & Agriculture",
    subStrand: "Science",
    topic: "Parts of a Plant",
    summary: "Learn the functions of each part of a plant with a labelled diagram.",
    notes: [
      "Root: holds the plant in the soil and absorbs water and minerals.",
      "Stem: carries water from the roots to the leaves.",
      "Leaves: make food for the plant using sunlight (photosynthesis).",
      "Flower: the reproductive part of the plant.",
      "Fruit: develops from the flower and contains seeds.",
      "Seeds: grow into new plants when planted in soil.",
      "Plants need sunlight, water, air, and nutrients to grow.",
    ],
    revisionQuestions: [
      { question: "Name two functions of the root.", answer: "Holds plant in soil; absorbs water and minerals", rubric: "2 marks" },
    ],
    difficulty: "intermediate",
    tags: ["science", "plant", "parts", "diagram", "photosynthesis"],
  },
  // Grade 5 — Agriculture
  {
    id: "stem-5-agriculture",
    grade: g(5),
    strand: "STEM & Agriculture",
    subStrand: "Agriculture",
    topic: "Crop Production: Planting Maize",
    summary: "Step-by-step guide to planting and caring for a maize crop.",
    notes: [
      "Step 1: Prepare the seedbed by clearing weeds and tilling the soil.",
      "Step 2: Dig holes about 20–30 cm deep and 75 cm apart.",
      "Step 3: Plant 2–3 maize seeds per hole and cover lightly with soil.",
      "Step 4: Water immediately after planting.",
      "Step 5: Thin seedlings after 2 weeks, leaving the strongest plant.",
      "Step 6: Apply top-dressing fertiliser after 4–6 weeks.",
      "Step 7: Harvest when the maize cobs are dry and the husks turn yellow.",
    ],
    revisionQuestions: [
      { question: "Why should seedlings be thinned after 2 weeks?", answer: "To leave only the strongest plant so it can grow well", rubric: "2 marks" },
    ],
    difficulty: "intermediate",
    tags: ["agriculture", "maize", "crop", "planting", "farming"],
  },
  // Grade 7 — Math
  {
    id: "stem-7-math-algebra",
    grade: g(7),
    strand: "STEM & Agriculture",
    subStrand: "Mathematics",
    topic: "Introduction to Algebra",
    summary: "Use letters to represent unknown numbers in equations.",
    notes: [
      "Algebra uses letters called variables to stand for unknown numbers.",
      "An expression is a mathematical phrase, e.g., 3x + 5.",
      "An equation states that two expressions are equal, e.g., 3x + 5 = 20.",
      "To solve an equation, isolate the variable on one side.",
      "Example: 3x + 5 = 20 → 3x = 15 → x = 5.",
      "Always perform the same operation on both sides of the equation.",
      "Check your answer by substituting back: 3(5) + 5 = 20 ✓",
    ],
    revisionQuestions: [
      { question: "Solve: 2x + 3 = 11", answer: "x = 4", rubric: "3 marks" },
    ],
    difficulty: "advanced",
    tags: ["math", "algebra", "equations", "variables"],
  },
  // Grade 9 — Science
  {
    id: "stem-9-science-motion",
    grade: g(9),
    strand: "STEM & Agriculture",
    subStrand: "Science",
    topic: "Linear Motion and Speed",
    summary: "Understand distance, displacement, speed, velocity, and acceleration.",
    notes: [
      "Distance is the total path length travelled; displacement is the shortest path between two points.",
      "Speed = distance ÷ time (units: m/s or km/h).",
      "Velocity is speed in a given direction.",
      "Acceleration = change in velocity ÷ time taken.",
      "Equations of uniformly accelerated motion: v = u + at, s = ut + ½at².",
      "A body at rest has zero velocity and zero acceleration.",
      "Graphs of motion: slope of distance-time graph gives speed; slope of velocity-time graph gives acceleration.",
    ],
    revisionQuestions: [
      { question: "A car travels 100 m in 10 s. Calculate its speed.", answer: "Speed = 100 ÷ 10 = 10 m/s", rubric: "3 marks" },
    ],
    difficulty: "advanced",
    tags: ["science", "physics", "motion", "speed", "velocity"],
  },
];

// ─── Social Studies & Arts ────────────────────────────────────────────────────
const socialStudiesArts: ContentItem[] = [
  // Grade 2
  {
    id: "ss-2-history",
    grade: g(2),
    strand: "Social Studies & Arts",
    subStrand: "History",
    topic: "My Family and Community History",
    summary: "Learn how to trace your family history and understand your community's past.",
    notes: [
      "Your family history starts with your parents and grandparents.",
      "Family trees show how family members are connected across generations.",
      "Community history includes stories about how your village or town began.",
      "Elders are important sources of history — interview them to learn more.",
      "Old photos, letters, and objects tell us about the past.",
      "Celebrations and festivals often remember important events from the past.",
    ],
    revisionQuestions: [
      { question: "Name two sources we can use to learn about family history.", answer: "Elders; old photos; letters; family objects", rubric: "2 marks" },
    ],
    difficulty: "beginner",
    tags: ["history", "family", "community", "generations"],
  },
  // Grade 4
  {
    id: "ss-4-geography",
    grade: g(4),
    strand: "Social Studies & Arts",
    subStrand: "Geography",
    topic: "Weather and Climate of Kenya",
    summary: "Understand the difference between weather and climate and Kenya's main climate zones.",
    notes: [
      "Weather is the day-to-day condition of the atmosphere.",
      "Climate is the average weather conditions over a long period (30+ years).",
      "Kenya has four main climate zones: hot and humid coastal strip; hot and dry northern Kenya; temperate highlands; semi-arid marginal lands.",
      "Factors affecting climate: altitude, distance from the equator, proximity to large water bodies.",
      "Weather instruments: thermometer (temperature), rain gauge (rainfall), wind vane (wind direction).",
      "Keep a weather chart for your locality for one week.",
    ],
    revisionQuestions: [
      { question: "What is the difference between weather and climate?", answer: "Weather is day-to-day conditions; climate is the average weather over a long period", rubric: "3 marks" },
    ],
    difficulty: "intermediate",
    tags: ["geography", "weather", "climate", "kenya"],
  },
  // Grade 6
  {
    id: "ss-6-creative-arts",
    grade: g(6),
    strand: "Social Studies & Arts",
    subStrand: "Creative Arts",
    topic: "Traditional Kenyan Music and Dance",
    summary: "Explore the music and dance traditions of Kenya's diverse communities.",
    notes: [
      "Kenya has over 40 ethnic communities, each with unique music and dance.",
      "Examples: Kalenjin traditional dance; Maasai singing and dancing; Luhya 'Isukuti' drumming; Kikuyu folk songs.",
      "Traditional instruments: nyatiti (lyre), orutu (single-string fiddle), djembe, drums, flutes.",
      "Music and dance are used in celebrations, ceremonies, and storytelling.",
      "Modern Kenyan music blends traditional rhythms with contemporary styles (Benga, Taarab, Gengetone).",
      "Activity: Learn a simple traditional dance step and present it to your class.",
    ],
    revisionQuestions: [
      { question: "Name two traditional Kenyan musical instruments.", answer: "Nyatiti, orutu, djembe, drums, flutes (any two)", rubric: "2 marks" },
    ],
    difficulty: "intermediate",
    tags: ["arts", "music", "dance", "traditional", "kenya"],
  },
  // Grade 8
  {
    id: "ss-8-history-kenya-colonial",
    grade: g(8),
    strand: "Social Studies & Arts",
    subStrand: "History",
    topic: "Kenya Under Colonial Rule",
    summary: "How British colonial rule shaped Kenya's society, economy, and politics.",
    notes: [
      "The Berlin Conference of 1884–85 partitioned Africa, leading to British colonization of Kenya.",
      "The Kenya Uganda Railway (1895–1901) opened up the interior.",
      "The White Highlands were seized from African communities and given to European settlers.",
      "Africans were forced to grow cash crops and pay taxes in cash.",
      "The 1921 Kawangware incident and Mau Mau uprising (1952–60) were key resistance movements.",
      "Loyalists and nationalists: Jomo Kenyatta, Oginga Odinga, Dedan Kimathi.",
      "Kenya gained independence on 12 December 1963.",
    ],
    revisionQuestions: [
      { question: "In what year did Kenya gain independence?", answer: "12 December 1963", rubric: "1 mark" },
    ],
    difficulty: "advanced",
    tags: ["history", "colonial", "mau mau", "independence", "kenya"],
  },
];

// ─── KICD Revision Bank ───────────────────────────────────────────────────────
const kicdRevision: ContentItem[] = [
  {
    id: "kicd-1-english",
    grade: g(1),
    strand: "KICD Revision Bank",
    subStrand: "English",
    topic: "Grade 1 English End-of-Term Assessment",
    summary: "Practice questions covering listening, speaking, reading, and writing for Grade 1.",
    notes: [
      "Listening: Follow two-step oral instructions.",
      "Speaking: Introduce yourself using name, age, and class.",
      "Reading: Read aloud simple sentences of 3–5 words.",
      "Writing: Copy sentences correctly; write name and date.",
      "Spelling: Spell 10 grade-appropriate words.",
      "Sample question: 'Write the missing letter: c _ t'",
      "Answer: cat",
    ],
    revisionQuestions: [
      { question: "Write the missing letter: b _ _ k", answer: "book", rubric: "2 marks" },
      { question: "Complete the sentence: 'My name is ______.'", answer: "Any appropriate name", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["kicd", "revision", "english", "assessment", "grade 1"],
  },
  {
    id: "kicd-3-math",
    grade: g(3),
    strand: "KICD Revision Bank",
    subStrand: "Mathematics",
    topic: "Grade 3 Mathematics End-of-Term Assessment",
    summary: "Practice assessment covering numbers, shapes, measurement, and word problems.",
    notes: [
      "Numbers: Count up to 1000; place value (hundreds, tens, ones); skip-counting by 2s, 5s, 10s.",
      "Addition and subtraction: 3-digit numbers with and without renaming.",
      "Multiplication: 2×, 3×, 5×, 10× tables.",
      "Fractions: halves, thirds, quarters of shapes and sets.",
      "Measurement: cm, m, kg; reading time to 5-minute intervals.",
      "Shapes: 2D (square, rectangle, triangle, circle); 3D (cube, cylinder, sphere).",
    ],
    revisionQuestions: [
      { question: "Calculate: 345 + 127 = ?", answer: "472", rubric: "2 marks" },
      { question: "What is ¾ of 12?", answer: "9", rubric: "2 marks" },
      { question: "How many edges does a cube have?", answer: "12", rubric: "1 mark" },
    ],
    difficulty: "intermediate",
    tags: ["kicd", "revision", "math", "assessment", "grade 3"],
  },
  {
    id: "kicd-5-science",
    grade: g(5),
    strand: "KICD Revision Bank",
    subStrand: "Science",
    topic: "Grade 5 Science End-of-Term Assessment",
    summary: "Practice questions on living things, matter, energy, and the earth.",
    notes: [
      "Living things: characteristics of plants and animals; life cycles.",
      "Food chains: producer → consumer → decomposer.",
      "Matter: solids, liquids, gases; changes of state (melting, evaporation, condensation).",
      "Energy: forms of energy; energy transfer; the sun as the primary source.",
      "The Earth: layers of the earth; rocks and soil.",
      "Human body: main organ systems — digestive, respiratory, circulatory.",
    ],
    revisionQuestions: [
      { question: "Draw a simple food chain with three organisms.", answer: "Grass → Grasshopper → Frog (or similar)", rubric: "3 marks" },
      { question: "What are the three states of matter?", answer: "Solid, liquid, gas", rubric: "1 mark" },
    ],
    difficulty: "intermediate",
    tags: ["kicd", "revision", "science", "assessment", "grade 5"],
  },
  {
    id: "kicd-7-english",
    grade: g(7),
    strand: "KICD Revision Bank",
    subStrand: "English",
    topic: "Grade 7 English End-of-Term Assessment",
    summary: "Practice papers covering usage, comprehension, and composition for Grade 7.",
    notes: [
      "Usage: tenses, modals (can, may, must), subject-verb agreement.",
      "Comprehension: read a passage and answer inference, vocabulary, and summary questions.",
      "Composition: write a well-structured expository or narrative essay (150–200 words).",
      "Grammar: clauses, conjunctions, prepositions, direct and indirect speech.",
      "Poetry: identify figurative language (simile, metaphor, personification).",
      "Rubric for composition: Content (5 marks), Organization (5 marks), Language (5 marks), Mechanics (5 marks).",
    ],
    revisionQuestions: [
      { question: "Rewrite in indirect speech: 'I will come tomorrow,' said Amina.", answer: "Amina said that she would come the following day.", rubric: "3 marks" },
    ],
    difficulty: "advanced",
    tags: ["kicd", "revision", "english", "assessment", "grade 7"],
  },
  {
    id: "kicd-9-math",
    grade: g(9),
    strand: "KICD Revision Bank",
    subStrand: "Mathematics",
    topic: "Grade 9 Mathematics End-of-Term Assessment",
    summary: "KCPE-style practice questions covering algebra, geometry, statistics, and trigonometry basics.",
    notes: [
      "Algebra: simplification, factorisation (common factor, difference of squares), quadratic equations.",
      "Geometry: angles in polygons, circle theorems, similarity and congruence.",
      "Statistics: mean, median, mode, range; data representation (bar graphs, pie charts).",
      "Trigonometry: SOHCAHTOA — sin, cos, tan of acute angles; using trigonometric tables.",
      "Number: integers, fractions, decimals, percentages, rates, ratios.",
      "Measurement: area and perimeter of composite shapes; volume of prisms and cylinders.",
    ],
    revisionQuestions: [
      { question: "Factorise completely: x² - 9", answer: "(x + 3)(x - 3)", rubric: "2 marks" },
      { question: "In a right triangle, angle A = 30° and hypotenuse = 10 cm. Find the length of the side opposite A.", answer: "sin 30° = ½ → side = 5 cm", rubric: "3 marks" },
    ],
    difficulty: "advanced",
    tags: ["kicd", "revision", "math", "assessment", "grade 9", "kcpe"],
  },
];

// ─── Assessments & Quizzes ─────────────────────────────────────────────────────
const assessmentsQuizzes: ContentItem[] = [
  // Grade 1 — English CAT
  {
    id: "assess-1-english-cat1",
    grade: g(1),
    strand: "Assessments & Quizzes",
    subStrand: "English",
    topic: "Grade 1 English — Continuous Assessment Test 1",
    summary: "10 questions covering colours, numbers, and simple vocabulary.",
    notes: [],
    revisionQuestions: [
      { question: "Colour the sky blue. What colour is it?", answer: "Blue", rubric: "1 mark" },
      { question: "Count the apples: 🍎🍎🍎 How many apples?", answer: "Three (3)", rubric: "1 mark" },
      { question: "Write the letter A in capital and small.", answer: "A a", rubric: "1 mark" },
      { question: "Circle the biggest object: 🐘 🌱 🐜", answer: "Elephant (🐘)", rubric: "1 mark" },
      { question: "Fill in the missing letter: C _ T", answer: "A → CAT", rubric: "2 marks" },
    ],
    difficulty: "beginner",
    tags: ["assessment", "cat", "english", "grade 1", "continuous assessment"],
  },
  // Grade 4 — Mathematics End-of-Term
  {
    id: "assess-4-math-eot",
    grade: g(4),
    strand: "Assessments & Quizzes",
    subStrand: "Mathematics",
    topic: "Grade 4 Mathematics — End of Term 1 Examination",
    summary: "40 marks. Covers numbers, shapes, measurement, and word problems.",
    notes: [],
    revisionQuestions: [
      { question: "Write in words: 4,506", answer: "Four thousand five hundred and six", rubric: "2 marks" },
      { question: "Calculate: 3,280 + 1,459 = ?", answer: "4,739", rubric: "3 marks" },
      { question: "A rectangle has length 8 cm and width 5 cm. Find its perimeter.", answer: "2(8+5) = 26 cm", rubric: "4 marks" },
      { question: "Convert 2 kg 350 g into grams.", answer: "2,350 g", rubric: "3 marks" },
      { question: "What is the place value of 7 in 7,349?", answer: "Thousands (7,000)", rubric: "2 marks" },
      { question: "Draw and name 3 types of angles.", answer: "Acute, Right, Obtuse", rubric: "3 marks" },
      { question: "Subtract: 5,000 − 2,783 = ?", answer: "2,217", rubric: "3 marks" },
    ],
    difficulty: "intermediate",
    tags: ["assessment", "end of term", "mathematics", "grade 4", "examination"],
  },
  // Grade 7 — CRE Topical Quiz
  {
    id: "assess-7-cre-quiz",
    grade: g(7),
    strand: "Assessments & Quizzes",
    subStrand: "CRE",
    topic: "Grade 7 CRE — The prophets of Israel: Topical Quiz",
    summary: "15 multiple-choice and short-answer questions on Old Testament prophets.",
    notes: [],
    revisionQuestions: [
      { question: "Which prophet defeated the prophets of Baal on Mount Carmel?", answer: "Elijah", rubric: "2 marks" },
      { question: "Name the two servants Elisha raised from death.", answer: "The Shunammite woman's son and Naaman's servant (Gehazi)", rubric: "3 marks" },
      { question: "What did Jeremiah call the new covenant?", answer: "A law written on the heart", rubric: "2 marks" },
      { question: "Isaiah called Emmanuel 'God with us'. True or false?", answer: "True", rubric: "1 mark" },
      { question: "Which prophet predicted the fall of Babylon?", answer: "Isaiah", rubric: "2 marks" },
    ],
    difficulty: "advanced",
    tags: ["quiz", "topical", "cre", "grade 7", "prophets", "old testament"],
  },
  // Grade 9 — KNEC Sample Paper
  {
    id: "assess-9-science-knec",
    grade: g(9),
    strand: "Assessments & Quizzes",
    subStrand: "Science",
    topic: "Grade 9 Science — KNEC Sample Paper (Physics Section)",
    summary: "KCPE-style structured and essay questions on linear motion, forces, and energy.",
    notes: [],
    revisionQuestions: [
      { question: "Define: (a) Speed, (b) Velocity.", answer: "(a) Rate of change of distance. (b) Rate of change of displacement (with direction).", rubric: "4 marks" },
      { question: "A car travels 200 m in 10 s. Calculate its speed.", answer: "Speed = 200 ÷ 10 = 20 m/s", rubric: "3 marks" },
      { question: "State Newton's First Law of Motion.", answer: "A body remains at rest or in uniform motion unless acted upon by an external force.", rubric: "3 marks" },
      { question: "What is the difference between mass and weight?", answer: "Mass is the quantity of matter (constant); weight is the force due to gravity (varies with location).", rubric: "4 marks" },
      { question: "A ball is thrown upwards with a velocity of 30 m/s. Calculate the maximum height reached. (g = 10 m/s²)", answer: "h = u²/(2g) = 900/(20) = 45 m", rubric: "5 marks" },
      { question: "State the law of conservation of energy.", answer: "Energy cannot be created or destroyed, only transformed from one form to another.", rubric: "3 marks" },
    ],
    difficulty: "advanced",
    tags: ["knec", "sample paper", "science", "grade 9", "physics", "kcpe"],
  },
  // Grade 5 — Kiswahili Insha
  {
    id: "assess-5-kiswahili-insha",
    grade: g(5),
    strand: "Assessments & Quizzes",
    subStrand: "Kiswahili",
    topic: "Grade 5 Kiswahili — Insha ya Maelezo (Descriptive Essay)",
    summary: "Write a well-structured descriptive essay of 150–200 words on a given topic.",
    notes: [],
    revisionQuestions: [
      { question: "Andika insha ya maelezo kuhusu 'Siku ya Kuzaliwa Kwangu'. (Use proper paragraphs: utangulizi, mwili, hitimisho.)", answer: "Descriptive essay with introduction (utangulizi), body (mwili), and conclusion (hitimisho). 150-200 words. Good Kiswahili vocabulary used.", rubric: "15 marks" },
      { question: "Taja sentensi tano (5) za maelezo katika insha yako.", answer: "Any 5 descriptive sentences in correct Kiswahili.", rubric: "5 marks" },
    ],
    difficulty: "intermediate",
    tags: ["insha", "kiswahili", "grade 5", "essay", "descriptive writing"],
  },
  // Grade 8 — English Composition
  {
    id: "assess-8-english-composition",
    grade: g(8),
    strand: "Assessments & Quizzes",
    subStrand: "English",
    topic: "Grade 8 English — Narrative Composition (End of Term 2)",
    summary: "Write a story of 200–250 words beginning with: 'The door creaked open and…'",
    notes: [],
    revisionQuestions: [
      { question: "Write a story beginning with: 'The door creaked open and…' (200–250 words)", answer: "Narrative composition with beginning, middle, end. Correct tense and paragraphing. Vivid descriptions. No spelling errors.", rubric: "20 marks" },
      { question: "Identify two narrative elements used in your story.", answer: "Any two: setting, character, plot, conflict, climax, resolution.", rubric: "2 marks" },
    ],
    difficulty: "advanced",
    tags: ["composition", "narrative", "english", "grade 8", "end of term"],
  },
];

// ─── KICD Lower Primary Samples ───────────────────────────────────────────────
const lowerPrimary: ContentItem[] = [
  // ── Grade 1 ────────────────────────────────────────────────────────────────
  {
    id: "lp-1-english-oral",
    grade: g(1),
    strand: "English Language Activities",
    subStrand: "Listening & Speaking",
    topic: "Greetings and Introductions",
    summary: "Pupils learn to greet others and introduce themselves using simple English phrases.",
    notes: [
      "Greetings: 'Good morning', 'Good afternoon', 'Good evening'.",
      "How are you? — I am fine, I am happy, I am sad.",
      "My name is… — Introduce yourself by name.",
      "I am (age) years old.",
      "Practice in pairs: greet your partner and ask their name.",
      "Songs and rhymes help reinforce greetings.",
      "Role-play greeting a visitor or teacher.",
    ],
    revisionQuestions: [
      { question: "How do you greet someone in the morning?", answer: "Good morning", rubric: "1 mark" },
      { question: "Complete: 'My name is ______.'", answer: "Any appropriate name", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["english", "greetings", "speaking", "grade 1", "lower primary"],
  },
  {
    id: "lp-1-kiswahili-maghairi",
    grade: g(1),
    strand: "Kiswahili Language / Kenya Sign Language Activities",
    subStrand: "Kusikiliza na Kusema",
    topic: "Magrohani na Majina",
    summary: "Wanafunzi hukusanya maneno ya kawaida na kujifunza kujtdhihirisha kwa Kiswahili.",
    notes: [
      "Salamu: 'Asubuhi njema', 'Mchana mwema', 'Jioni njema'.",
      "Habari yako? — Njema sana, nzuri, ya kawaida.",
      "Jina langu ni… — Jtdhihirisha jina lako.",
      "Somo jipya: 'sana', 'vipi', 'kwa', 'hapa'.",
      "Oga taratibu dhana mpya kwa sentensi fupi.",
      "Tumia picha na michoro kujifunza msamiati mpya.",
      "Cheza mchezo wa 'sema jina lako' darasani.",
    ],
    revisionQuestions: [
      { question: "Je. Unavyoghustania aje mtu alfasi ya subuhi?", answer: "Asubuhi njema", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["kiswahili", "maghairi", "kusoma", "grade 1", "lower primary"],
  },
  {
    id: "lp-1-math-numbers",
    grade: g(1),
    strand: "Mathematical Activities",
    subStrand: "Numbers",
    topic: "Counting Numbers 1–20",
    summary: "Count objects up to 20 and write the corresponding numerals.",
    notes: [
      "Count objects in the classroom: desks, chairs, pencils.",
      "Numbers 1–10: one, two, three, four, five, six, seven, eight, nine, ten.",
      "Numbers 11–20: eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty.",
      "Use fingers to count from 1 to 10.",
      "Match numbers to objects: 'How many books? — Three books.'",
      "Practice writing numerals 0–9 correctly.",
      "Skip-count by 2s using objects like pairs of socks.",
    ],
    revisionQuestions: [
      { question: "Count aloud: 1, 2, 3, 4, _______, 6.", answer: "5", rubric: "1 mark" },
      { question: "Write the numeral for 'twelve'.", answer: "12", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["math", "counting", "numbers", "grade 1", "lower primary"],
  },
  {
    id: "lp-1-environmental",
    grade: g(1),
    strand: "Environmental Activities",
    subStrand: "Living Things",
    topic: "Plants in Our Environment",
    summary: "Identify different types of plants and their basic parts.",
    notes: [
      "Plants are living things — they grow, need water and sunlight.",
      "Basic parts of a plant: root, stem, leaf, flower.",
      "Common plants: grass, maize, bean plant, mango tree, rose.",
      "Plants give us food, oxygen, and shade.",
      "Look around your home and school — name three plants you see.",
      "A seed grows into a plant — plant a bean seed and observe.",
      "Take care of plants: water them, keep them clean.",
    ],
    revisionQuestions: [
      { question: "Name two things a plant needs to grow.", answer: "Water and sunlight", rubric: "2 marks" },
      { question: "Name one part of a plant.", answer: "Root, stem, leaf, or flower (any one)", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["environmental", "plants", "living things", "grade 1", "lower primary"],
  },
  {
    id: "lp-1-hygiene",
    grade: g(1),
    strand: "Hygiene and Nutrition Activities",
    subStrand: "Personal Hygiene",
    topic: "Keeping Our Bodies Clean",
    summary: "Learn daily habits to keep the body clean and healthy.",
    notes: [
      "Wash hands with soap and water before eating and after using the toilet.",
      "Brush teeth twice a day — morning and night.",
      "Take a bath every day to keep the body clean.",
      "Cut fingernails regularly to keep them short and clean.",
      "Wear clean clothes every day.",
      "Clean nose properly — use a tissue or handkerchief.",
      "Sleep early so the body rests and grows well.",
    ],
    revisionQuestions: [
      { question: "When should we wash our hands?", answer: "Before eating and after using the toilet", rubric: "2 marks" },
      { question: "How many times should we brush our teeth in a day?", answer: "Twice a day", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["hygiene", "health", "cleanliness", "grade 1", "lower primary"],
  },
  {
    id: "lp-1-cre",
    grade: g(1),
    strand: "Religious Education Activities",
    subStrand: "God's Love",
    topic: "God Made Everything",
    summary: "Understand that God created the world and loves us.",
    notes: [
      "God created the sun, moon, stars, animals, and human beings.",
      "God loves every child — you are special to God.",
      "We say 'Thank you, God' for food, family, and the world.",
      "Genesis 1:1 — 'In the beginning God created the heavens and the earth.'",
      "Ways to show love to God: praying, singing, sharing, being kind.",
      "God gives us nature to enjoy and take care of.",
      "Jesus taught us to love one another.",
    ],
    memoryVerses: [
      { reference: "Genesis 1:1", text: "In the beginning God created the heavens and the earth." },
    ],
    revisionQuestions: [
      { question: "Who created the world?", answer: "God", rubric: "1 mark" },
      { question: "Name one way we can show love to God.", answer: "Praying, singing hymns, sharing with others, being kind", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["cre", "religious education", "creation", "grade 1", "lower primary"],
  },
  {
    id: "lp-1-creative-movement",
    grade: g(1),
    strand: "Movement and Creative Activities",
    subStrand: "Physical Education",
    topic: "Moving Our Bodies — Running, Jumping, and Balancing",
    summary: "Practice basic movement skills through fun physical activities.",
    notes: [
      "Warm up before exercise — stretch your arms and legs.",
      "Run in a straight line, then in a zigzag path.",
      "Jump with both feet together — frog jumps.",
      "Balance on one foot for 10 seconds.",
      "Dance to music — move your body to the rhythm.",
      "Play simple relay games in teams.",
      "Cool down after exercise — slow breathing, gentle stretching.",
    ],
    revisionQuestions: [
      { question: "What should you do before starting exercise?", answer: "Warm up — stretch your arms and legs", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["physical education", "movement", "creative", "grade 1", "lower primary"],
  },

  // ── Grade 2 ────────────────────────────────────────────────────────────────
  {
    id: "lp-2-english-reading",
    grade: g(2),
    strand: "English Language Activities",
    subStrand: "Reading",
    topic: "Reading Simple Sentences",
    summary: "Read simple sentences of 3–5 words with understanding.",
    notes: [
      "Read each word slowly before putting them together.",
      "Look at the picture clues — they help you understand the story.",
      "Point to each word as you read.",
      "Sentences: 'The cat is on the mat.', 'I like mangoes.', 'We go to school.'",
      "Read aloud every day — practice with classmates and teachers.",
      "Use the library corner in class to read picture books.",
      "Ask your teacher if you don't know a word.",
    ],
    revisionQuestions: [
      { question: "Read this sentence aloud: 'The dog runs fast.'", answer: "The dog runs fast.", rubric: "2 marks" },
    ],
    difficulty: "beginner",
    tags: ["english", "reading", "sentences", "grade 2", "lower primary"],
  },
  {
    id: "lp-2-kiswahili-insha",
    grade: g(2),
    strand: "Kiswahili Language / Kenya Sign Language Activities",
    subStrand: "Kuandika",
    topic: "Kuandika Sentensi Fupi",
    summary: "Wanafunzi hujifunza kuandika sentensi fupi kwa Kiswahili.",
    notes: [
      "Sentensi ina mwanzilishi, kitenzi, na mwisho.",
      "Mfano: 'Mimi ni mwanafunzi.' (subject + verb + object).",
      "Andika herufi kubwa mwanzoni mwa sentensi.",
      "Tumia nukushi katika mwisho wa sentensi.",
      "Fanya mazoezi: 'Nina mkate.' 'Unaumba nini?'",
      "Oga kuandika maneno mapya kwa makini.",
      "Soma insha yako kwa sauti baada ya kuandika.",
    ],
    revisionQuestions: [
      { question: "Andika sentensi moja kwa Kiswahili kuhusu darasani.", answer: "Mimi ni mwanafunzi. / Nina daftari.", rubric: "2 marks" },
    ],
    difficulty: "beginner",
    tags: ["kiswahili", "kuandika", "sentensi", "grade 2", "lower primary"],
  },
  {
    id: "lp-2-math-addition",
    grade: g(2),
    strand: "Mathematical Activities",
    subStrand: "Numbers",
    topic: "Addition of Two-Digit Numbers Without Renaming",
    summary: "Add two-digit numbers where the sum of ones is less than 10.",
    notes: [
      "Addition means putting groups together.",
      "The '+' sign means 'plus' or 'add'.",
      "Add the ones first, then the tens.",
      "Example: 23 + 15 → 3 + 5 = 8 (ones), 20 + 10 = 30 (tens), so 23 + 15 = 38.",
      "Use counters or number lines to help you visualise.",
      "Check your answer by counting backwards (subtraction).",
      "Practice: 12 + 24 = ?    31 + 45 = ?    20 + 19 = ?",
    ],
    revisionQuestions: [
      { question: "Calculate: 23 + 15 = ?", answer: "38", rubric: "2 marks" },
      { question: "Calculate: 31 + 48 = ?", answer: "79", rubric: "2 marks" },
    ],
    difficulty: "beginner",
    tags: ["math", "addition", "numbers", "grade 2", "lower primary"],
  },
  {
    id: "lp-2-environmental-weather",
    grade: g(2),
    strand: "Environmental Activities",
    subStrand: "Weather",
    topic: "Types of Weather and Their Effects",
    summary: "Observe and describe different types of weather and how they affect us.",
    notes: [
      "Types of weather: sunny, cloudy, rainy, windy, foggy.",
      "Sunny weather: bright, hot — we play outside, clothes dry fast.",
      "Rainy weather: wet, cool — we carry umbrellas, wear raincoats.",
      "Cloudy weather: grey sky — it may rain soon.",
      "Keep a weather chart — draw or write what the weather is like each day.",
      "Farmers need sunshine and rain to grow food.",
      "Too much sun can cause sunburn — use sunscreen or stay in shade.",
    ],
    revisionQuestions: [
      { question: "Name two types of weather.", answer: "Sunny, cloudy, rainy, windy (any two)", rubric: "2 marks" },
      { question: "What do farmers need from weather to grow food?", answer: "Sunshine and rain", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["environmental", "weather", "grade 2", "lower primary"],
  },
  {
    id: "lp-2-hygiene-food",
    grade: g(2),
    strand: "Hygiene and Nutrition Activities",
    subStrand: "Nutrition",
    topic: "Types of Food and Why We Need Them",
    summary: "Learn about the different food groups and why each one is important.",
    notes: [
      "We need food to grow, give us energy, and stay healthy.",
      "Carbohydrates: bread, rice, ugali, potatoes — give energy.",
      "Proteins: meat, eggs, fish, beans — build and repair the body.",
      "Vitamins: fruits and vegetables — protect us from sickness.",
      "Drink water every day — at least 8 glasses.",
      "Eat three meals a day: breakfast, lunch, and supper.",
      "Avoid too much sugar and salty foods.",
    ],
    revisionQuestions: [
      { question: "Which food group gives us energy?", answer: "Carbohydrates (e.g., bread, rice, ugali)", rubric: "1 mark" },
      { question: "Name one food that contains protein.", answer: "Meat, eggs, fish, or beans", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["hygiene", "nutrition", "food groups", "grade 2", "lower primary"],
  },
  {
    id: "lp-2-cre-family",
    grade: g(2),
    strand: "Religious Education Activities",
    subStrand: "Family in Faith",
    topic: "God's Family and Our Family",
    summary: "Understand that our family is a gift from God and how to care for one another.",
    notes: [
      "Every family is a gift from God.",
      "In a family we have: mother, father, brothers, sisters, grandparents.",
      "Families care for each other — parents provide food, shelter, and love.",
      "We should love, respect, and help our family members.",
      "Church family: Christians belong to a bigger family — the church.",
      "Prayer: 'Thank you, God, for my family.'",
      "Being honest, sharing, and forgiving are signs of a loving family.",
    ],
    memoryVerses: [
      { reference: "1 Timothy 5:4", text: "Family members should care for each other." },
    ],
    revisionQuestions: [
      { question: "Name two members of a family.", answer: "Mother, father, brother, sister, grandfather, grandmother (any two)", rubric: "2 marks" },
    ],
    difficulty: "beginner",
    tags: ["cre", "religious education", "family", "grade 2", "lower primary"],
  },
  {
    id: "lp-2-art-craft",
    grade: g(2),
    strand: "Movement and Creative Activities",
    subStrand: "Art & Craft",
    topic: "Drawing and Colouring with Natural Materials",
    summary: "Create art using crayons, coloured pencils, and natural materials from the environment.",
    notes: [
      "Use crayons and coloured pencils to draw pictures.",
      "Draw your family, school, or favourite animal.",
      "Use leaves, petals, and soil to make natural art (leaf printing).",
      "Colour inside the lines neatly.",
      "Mix primary colours (red, yellow, blue) to make secondary colours.",
      "Display your artwork in the classroom.",
      "Art helps us express our feelings and creativity.",
    ],
    revisionQuestions: [
      { question: "What colours do you mix to make green?", answer: "Blue and yellow", rubric: "1 mark" },
    ],
    difficulty: "beginner",
    tags: ["art", "craft", "creative", "grade 2", "lower primary"],
  },

  // ── Grade 3 ────────────────────────────────────────────────────────────────
  {
    id: "lp-3-english-composition",
    grade: g(3),
    strand: "English Language Activities",
    subStrand: "Writing",
    topic: "Writing a Simple Paragraph — About My School",
    summary: "Write a short paragraph of 3–5 sentences about your school.",
    notes: [
      "A paragraph is a group of sentences about one idea.",
      "Start with a topic sentence: 'My school is called...'",
      "Add details: what subjects you learn, who your teachers are.",
      "End with a concluding sentence: 'I love my school because...'",
      "Use capital letters at the beginning of sentences and for names.",
      "Use full stops (.) at the end of each sentence.",
      "Read your paragraph aloud to check it makes sense.",
    ],
    revisionQuestions: [
      { question: "Write three sentences about your school.", answer: "Paragraph with at least 3 correct sentences about school", rubric: "6 marks (2 per sentence)" },
    ],
    difficulty: "intermediate",
    tags: ["english", "writing", "composition", "grade 3", "lower primary"],
  },
  {
    id: "lp-3-kiswahili-maswali",
    grade: g(3),
    strand: "Kiswahili Language / Kenya Sign Language Activities",
    subStrand: "Kusoma na Kutunga",
    topic: "Kusoma Swali na Jibu",
    summary: "Wanafunzi hujifunza kusoma maswali na kutoa jibu sahihi.",
    notes: [
      "Swali huwa na nukushi ya 'ni' au 'je' mwanzoni.",
      "Mfano: 'Je, wewe ni nani?' — Jibu: 'Mimi ni Juma.'",
      "Soma kwa sauti, kisha jibu kwa maneno yako mwenyewe.",
      "Fahamu aina za maswali: 'Nani?', 'Lini?', 'Wapi?', 'Vipi?'",
      "Mazoezi: 'Je, unaenda shuleni?' — Ndiyo / Hapana.",
      "Jibu kwa sentensi kamili, si tu 'ndiyo' au 'hapana'.",
      "Tumia msamiati mpya uliyojifunza katika sentensi.",
    ],
    revisionQuestions: [
      { question: "Jibu swali hili: 'Je, una mama w有几人?'", answer: "Mimi ni Juma. / Jibu lenye maana", rubric: "2 marks" },
    ],
    difficulty: "intermediate",
    tags: ["kiswahili", "kusoma", "maswali", "grade 3", "lower primary"],
  },
  {
    id: "lp-3-math-multiplication",
    grade: g(3),
    strand: "Mathematical Activities",
    subStrand: "Numbers",
    topic: "Multiplication as Repeated Addition (2×, 3×, 5×, 10× Tables)",
    summary: "Understand multiplication as repeated addition and learn the 2×, 3×, 5×, and 10× tables.",
    notes: [
      "Multiplication is repeated addition: 3 × 4 means 4 + 4 + 4 = 12.",
      "The '×' sign means 'times' or 'groups of'.",
      "2× table: 1×2=2, 2×2=4, 3×2=6, 4×2=8, 5×2=10, 6×2=12, 7×2=14, 8×2=16, 9×2=18, 10×2=20.",
      "3× table: 1×3=3, 2×3=6, 3×3=9, 4×3=12, 5×3=15, 6×3=18, 7×3=21, 8×3=24, 9×3=27, 10×3=30.",
      "5× table: 1×5=5, 2×5=10, 3×5=15, 4×5=20, 5×5=25, 6×5=30, 7×5=35, 8×5=40, 9×5=45, 10×5=50.",
      "10× table: simply add a zero: 1×10=10, 2×10=20, 3×10=30, ..., 10×10=100.",
      "Use objects to build groups: 3 groups of 4 pencils = 3 × 4 = 12 pencils.",
    ],
    revisionQuestions: [
      { question: "Calculate: 4 × 3 = ?", answer: "12", rubric: "1 mark" },
      { question: "What is 7 × 5?", answer: "35", rubric: "1 mark" },
      { question: "What does 6 × 10 equal?", answer: "60", rubric: "1 mark" },
    ],
    difficulty: "intermediate",
    tags: ["math", "multiplication", "tables", "grade 3", "lower primary"],
  },
  {
    id: "lp-3-environmental-animals",
    grade: g(3),
    strand: "Environmental Activities",
    subStrand: "Living Things",
    topic: "Farm Animals — Their Uses and Care",
    summary: "Identify farm animals, their products, and how to care for them.",
    notes: [
      "Farm animals: cows, goats, sheep, chickens, rabbits, donkeys.",
      "Cows give milk and beef; goats give milk and meat.",
      "Chickens give eggs and meat.",
      "Sheep give wool (for clothes) and meat.",
      "Donkeys and oxen are used for work — carrying loads and ploughing.",
      "Care for animals: give them clean water, food, and shelter.",
      "Keep animal shelters clean to prevent disease.",
    ],
    revisionQuestions: [
      { question: "Name two products we get from cows.", answer: "Milk and beef (or hide for leather)", rubric: "2 marks" },
      { question: "Why should we keep animal shelters clean?", answer: "To prevent diseases", rubric: "1 mark" },
    ],
    difficulty: "intermediate",
    tags: ["environmental", "farm animals", "living things", "grade 3", "lower primary"],
  },
  {
    id: "lp-3-hygiene-diseases",
    grade: g(3),
    strand: "Hygiene and Nutrition Activities",
    subStrand: "Health",
    topic: "Common Diseases and How to Prevent Them",
    summary: "Learn about common childhood diseases and ways to stay healthy.",
    notes: [
      "Common diseases: malaria, diarrhoea, cough and cold, typhoid.",
      "Malaria is spread by mosquitoes — sleep under a mosquito net.",
      "Diarrhoea is caused by dirty water and food — wash hands before eating.",
      "Cough and cold spread through air and sharing items — cover your mouth when coughing.",
      "Prevent diseases: wash hands, drink clean water, eat well, sleep enough.",
      "Vaccinations protect us from serious diseases — go for regular check-ups.",
      "When you feel sick, tell your teacher or parent and see a doctor.",
    ],
    revisionQuestions: [
      { question: "How is malaria spread?", answer: "By mosquitoes", rubric: "1 mark" },
      { question: "Name two ways to prevent diseases.", answer: "Wash hands; drink clean water; eat well; sleep enough; sleep under mosquito net", rubric: "2 marks" },
    ],
    difficulty: "intermediate",
    tags: ["hygiene", "health", "diseases", "grade 3", "lower primary"],
  },
  {
    id: "lp-3-cre-stories",
    grade: g(3),
    strand: "Religious Education Activities",
    subStrand: "Bible Stories",
    topic: "David and Goliath — Trusting God",
    summary: "Learn how David defeated Goliath by trusting in God.",
    notes: [
      "David was a shepherd boy who loved God.",
      "The Philistine giant Goliath challenged Israel's army — no one was brave enough to fight him.",
      "David volunteered to fight Goliath with just a sling and five smooth stones.",
      "David said: 'You come against me with sword and spear, but I come against you in the name of the LORD.'",
      "David struck Goliath with a stone from his sling and Goliath fell.",
      "The story teaches us: with God on our side, we can overcome any fear.",
      "Trust God in difficult situations — pray and be brave.",
    ],
    memoryVerses: [
      { reference: "1 Samuel 17:45", text: "You come against me with sword and spear, but I come against you in the name of the LORD." },
    ],
    revisionQuestions: [
      { question: "Who defeated Goliath?", answer: "David", rubric: "1 mark" },
      { question: "What did David use to fight Goliath?", answer: "A sling and five smooth stones", rubric: "1 mark" },
    ],
    difficulty: "intermediate",
    tags: ["cre", "religious education", "bible story", "david", "grade 3", "lower primary"],
  },
  {
    id: "lp-3-music-rhythms",
    grade: g(3),
    strand: "Movement and Creative Activities",
    subStrand: "Music",
    topic: "Singing Songs and Clapping Rhythms",
    summary: "Learn traditional and modern Kenyan songs with correct rhythm and melody.",
    notes: [
      "Kenyan songs express joy, culture, and unity.",
      "Sing national songs: 'Ee Mungu Nguvu Yetu' and school anthems.",
      "Traditional songs: folk songs from your community.",
      "Clap or tap to keep the rhythm while singing.",
      "Sing in groups — blend your voice with others.",
      "Learn call-and-response songs: leader sings a line, class responds.",
      "Music builds confidence and brings people together.",
    ],
    revisionQuestions: [
      { question: "Name Kenya's national anthem in Swahili.", answer: "Ee Mungu Nguvu Yetu", rubric: "1 mark" },
    ],
    difficulty: "intermediate",
    tags: ["music", "singing", "creative", "grade 3", "lower primary"],
  },
];

// ─── Export ───────────────────────────────────────────────────────────────────
export const cbcStudyContent: ContentItem[] = [
  ...creValues,
  ...languages,
  ...stemAgriculture,
  ...socialStudiesArts,
  ...kicdRevision,
  ...assessmentsQuizzes,
  ...lowerPrimary,
];

export const strandCategories: StrandCategory[] = [
  "CRE & Values",
  "Languages",
  "STEM & Agriculture",
  "Social Studies & Arts",
  "KICD Revision Bank",
  "Assessments & Quizzes",
  // ── KICD Lower Primary (Grades 1–3) ─────────────────────────────────────
  "Indigenous Language Activities",
  "Kiswahili Language / Kenya Sign Language Activities",
  "English Language Activities",
  "Mathematical Activities",
  "Environmental Activities",
  "Hygiene and Nutrition Activities",
  "Religious Education Activities",
  "Movement and Creative Activities",
];

export const gradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type GradeLevel = (typeof gradeLevels)[number];
