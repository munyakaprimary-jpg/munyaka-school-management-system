import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { showSuccess, showError } from '@/utils/toast';
import { CentralDataService } from '@/services/centralDataService';

export const purgeAndRebuildLearnerDirectory = () => {
  const currentYear = new Date().getFullYear();
  
  // Professional, clean seed sample across PP1 up to Grade 8
  const sampleLearners = [
    {
      id: "learner-001",
      name: "Amina Kiprop Cheptoo",
      fullName: "Amina Kiprop Cheptoo",
      admissionNumber: "MUN-001-2024",
      admNo: "MUN-001-2024",
      assessmentNumber: "ASS-441201",
      assessmentNo: "ASS-441201",
      grade: "Grade 6",
      class: "Grade 6",
      stream: "BLUE",
      gender: "Female",
      dateOfBirth: "2013-04-12",
      parentName: "David Kiprop",
      phoneNumber: "+254 712 345 678",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-002",
      name: "Brian Otieno Ochieng",
      fullName: "Brian Otieno Ochieng",
      admissionNumber: "MUN-002-2024",
      admNo: "MUN-002-2024",
      assessmentNumber: "ASS-441202",
      assessmentNo: "ASS-441202",
      grade: "Grade 6",
      class: "Grade 6",
      stream: "BLUE",
      gender: "Male",
      dateOfBirth: "2013-09-20",
      parentName: "Grace Ochieng",
      phoneNumber: "+254 722 987 654",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-003",
      name: "Chloe Wanjiku Njuguna",
      fullName: "Chloe Wanjiku Njuguna",
      admissionNumber: "MUN-003-2024",
      admNo: "MUN-003-2024",
      assessmentNumber: "ASS-441203",
      assessmentNo: "ASS-441203",
      grade: "Grade 5",
      class: "Grade 5",
      stream: "RED",
      gender: "Female",
      dateOfBirth: "2014-02-15",
      parentName: "Samuel Njuguna",
      phoneNumber: "+254 733 112 233",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-004",
      name: "Daniel Mutua Wambua",
      fullName: "Daniel Mutua Wambua",
      admissionNumber: "MUN-004-2024",
      admNo: "MUN-004-2024",
      assessmentNumber: "ASS-441204",
      assessmentNo: "ASS-441204",
      grade: "Grade 5",
      class: "Grade 5",
      stream: "RED",
      gender: "Male",
      dateOfBirth: "2014-06-11",
      parentName: "Esther Wambua",
      phoneNumber: "+254 745 667 889",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-005",
      name: "Eunice Akinyi Odhiambo",
      fullName: "Eunice Akinyi Odhiambo",
      admissionNumber: "MUN-005-2024",
      admNo: "MUN-005-2024",
      assessmentNumber: "ASS-441205",
      assessmentNo: "ASS-441205",
      grade: "Grade 4",
      class: "Grade 4",
      stream: "GREEN",
      gender: "Female",
      dateOfBirth: "2015-01-30",
      parentName: "Tom Odhiambo",
      phoneNumber: "+254 711 223 344",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-006",
      name: "Faith Njeri Kamau",
      fullName: "Faith Njeri Kamau",
      admissionNumber: "MUN-006-2024",
      admNo: "MUN-006-2024",
      assessmentNumber: "ASS-441206",
      assessmentNo: "ASS-441206",
      grade: "Grade 4",
      class: "Grade 4",
      stream: "GREEN",
      gender: "Female",
      dateOfBirth: "2015-08-05",
      parentName: "Peter Kamau",
      phoneNumber: "+254 788 990 011",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-007",
      name: "George Kiprono Koech",
      fullName: "George Kiprono Koech",
      admissionNumber: "MUN-007-2024",
      admNo: "MUN-007-2024",
      assessmentNumber: "ASS-441207",
      assessmentNo: "ASS-441207",
      grade: "Grade 3",
      class: "Grade 3",
      stream: "BLUE",
      gender: "Male",
      dateOfBirth: "2016-03-22",
      parentName: "Sarah Koech",
      phoneNumber: "+254 700 123 456",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-008",
      name: "Hellen Adhiambo Ouma",
      fullName: "Hellen Adhiambo Ouma",
      admissionNumber: "MUN-008-2024",
      admNo: "MUN-008-2024",
      assessmentNumber: "ASS-441208",
      assessmentNo: "ASS-441208",
      grade: "Grade 3",
      class: "Grade 3",
      stream: "BLUE",
      gender: "Female",
      dateOfBirth: "2016-11-19",
      parentName: "Michael Ouma",
      phoneNumber: "+254 722 334 455",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-009",
      name: "Ian Maina Mwangi",
      fullName: "Ian Maina Mwangi",
      admissionNumber: "MUN-009-2024",
      admNo: "MUN-009-2024",
      assessmentNumber: "ASS-441209",
      assessmentNo: "ASS-441209",
      grade: "Grade 2",
      class: "Grade 2",
      stream: "RED",
      gender: "Male",
      dateOfBirth: "2017-05-14",
      parentName: "Alice Mwangi",
      phoneNumber: "+254 733 556 677",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-010",
      name: "Joy Chebet Rono",
      fullName: "Joy Chebet Rono",
      admissionNumber: "MUN-010-2024",
      admNo: "MUN-010-2024",
      assessmentNumber: "ASS-441210",
      assessmentNo: "ASS-441210",
      grade: "Grade 2",
      class: "Grade 2",
      stream: "RED",
      gender: "Female",
      dateOfBirth: "2017-10-08",
      parentName: "Kiprono Rono",
      phoneNumber: "+254 714 889 900",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-011",
      name: "Kevin Juma Barasa",
      fullName: "Kevin Juma Barasa",
      admissionNumber: "MUN-011-2024",
      admNo: "MUN-011-2024",
      assessmentNumber: "ASS-441211",
      assessmentNo: "ASS-441211",
      grade: "Grade 1",
      class: "Grade 1",
      stream: "GREEN",
      gender: "Male",
      dateOfBirth: "2018-01-25",
      parentName: "Beatrice Barasa",
      phoneNumber: "+254 725 111 222",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-012",
      name: "Linda Nyaboke Makori",
      fullName: "Linda Nyaboke Makori",
      admissionNumber: "MUN-012-2024",
      admNo: "MUN-012-2024",
      assessmentNumber: "ASS-441212",
      assessmentNo: "ASS-441212",
      grade: "Grade 1",
      class: "Grade 1",
      stream: "GREEN",
      gender: "Female",
      dateOfBirth: "2018-07-12",
      parentName: "Erick Makori",
      phoneNumber: "+254 736 444 555",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-013",
      name: "Maxwel Kiprop Ngetich",
      fullName: "Maxwel Kiprop Ngetich",
      admissionNumber: "MUN-013-2024",
      admNo: "MUN-013-2024",
      assessmentNumber: "ASS-441213",
      assessmentNo: "ASS-441213",
      grade: "PP2",
      class: "PP2",
      stream: "BLUE",
      gender: "Male",
      dateOfBirth: "2019-02-18",
      parentName: "Rose Ngetich",
      phoneNumber: "+254 717 778 899",
      updatedAt: new Date().toISOString()
    },
    {
      id: "learner-014",
      name: "Nancy Chepkemoi Korir",
      fullName: "Nancy Chepkemoi Korir",
      admissionNumber: "MUN-014-2024",
      admNo: "MUN-014-2024",
      assessmentNumber: "ASS-441214",
      assessmentNo: "ASS-441214",
      grade: "PP1",
      class: "PP1",
      stream: "BLUE",
      gender: "Female",
      dateOfBirth: "2020-05-30",
      parentName: "William Korir",
      phoneNumber: "+254 728 001 122",
      updatedAt: new Date().toISOString()
    }
  ];

  try {
    // Clear all legacy storage keys
    localStorage.setItem('munyaka_learners', JSON.stringify(sampleLearners));
    localStorage.setItem('school_students_data', JSON.stringify(sampleLearners));
    localStorage.setItem('munyaka_students_directory', JSON.stringify(sampleLearners));
    localStorage.setItem('munyaka_master_learners', JSON.stringify(sampleLearners));
    
    CentralDataService.saveLearners(sampleLearners);
    
    window.dispatchEvent(new Event('students-updated'));
    window.dispatchEvent(new Event('learners-updated'));
    window.dispatchEvent(new Event('munyaka:data-changed'));

    console.info("Learner directory successfully purged and rebuilt with 14 professional clean records.");
  } catch (err) {
    console.error("Failed to purge and rebuild learners:", err);
  }
};
