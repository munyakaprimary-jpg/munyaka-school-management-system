// ─── CBC Study Content — Kenya Curriculum Grades 1–9 ─────────────────────────
// Each content card belongs to one strand. The StudyCorner page filters and
// searches across strands, sub-strands, and topics.

export type StrandCategory =
  | "CRE & Values"
  | "Languages"
  | "STEM & Agriculture"
  | "Social Studies & Arts"
  | "KICD Revision Bank";

export interface MemoryVerse {
  reference: string;
  text: string;
}

export interface RevisionQuestion {
  question: string;
  answer: string;
  rubric?: string;
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
}

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

// ─── Export ───────────────────────────────────────────────────────────────────
export const cbcStudyContent: ContentItem[] = [
  ...creValues,
  ...languages,
  ...stemAgriculture,
  ...socialStudiesArts,
  ...kicdRevision,
];

export const strandCategories: StrandCategory[] = [
  "CRE & Values",
  "Languages",
  "STEM & Agriculture",
  "Social Studies & Arts",
  "KICD Revision Bank",
];

export const gradeLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type GradeLevel = (typeof gradeLevels)[number];
