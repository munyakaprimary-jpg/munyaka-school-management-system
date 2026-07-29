import { Artifact } from '@/types/portfolio';

export const INITIAL_ARTIFACTS: Artifact[] = [
  { 
    id: "1", 
    student: "Brian Kiptoo", 
    title: "Clay Modeling: Animals", 
    type: "Image", 
    learningArea: "Creative Arts", 
    date: "Oct 12, 2023", 
    grade: "EE", 
    description: "Created an intricate lion sculpture using local clay and natural dyes.", 
    fileName: "clay_sculpture_lion.jpg", 
    fileSize: "1.2 MB",
    fileUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80"
  },
  { 
    id: "2", 
    student: "Mary Atieno", 
    title: "Oral Narrative Audio", 
    type: "Audio", 
    learningArea: "English", 
    date: "Oct 15, 2023", 
    grade: "ME", 
    description: "Recited a 2-minute original story with clear diction and expressions.", 
    fileName: "oral_narrative_recording.mp3", 
    fileSize: "3.4 MB",
    fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  { 
    id: "3", 
    student: "Emmanuel Maina", 
    title: "Recycling Project Report", 
    type: "Document", 
    learningArea: "Science", 
    date: "Oct 18, 2023", 
    grade: "EE", 
    description: "Documented step-by-step process of making a toy car from plastic bottles.", 
    fileName: "recycling_project.pdf", 
    fileSize: "850 KB",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
  },
  { 
    id: "4", 
    student: "Sheila Chepkoech", 
    title: "Traditional Dance Performance", 
    type: "Video", 
    learningArea: "Creative Arts", 
    date: "Nov 02, 2023", 
    grade: "EE", 
    description: "Demonstrated folk dance rhythm and costume coordination.", 
    fileName: "folk_dance_clip.mp4", 
    fileSize: "14.8 MB",
    fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  },
];