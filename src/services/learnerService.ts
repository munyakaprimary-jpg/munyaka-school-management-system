import { db } from "@/config/firebase";
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, onSnapshot } from "firebase/firestore";

export interface LearnerRecord {
  id: string;
  admissionNumber: string;
  fullName: string;
  gradeLevel?: string;
  grade?: string;
  stream?: string;
  gender?: string;
  dateOfBirth?: string;
  parentName?: string;
  phoneNumber?: string;
  status?: string;
  [key: string]: any;
}

export const learnerService = {
  async saveLearner(learnerData: LearnerRecord): Promise<string> {
    const docId = learnerData.admissionNumber 
      ? learnerData.admissionNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
      : `learner_${Date.now()}`;
    
    await setDoc(doc(db, "learners", docId), {
      ...learnerData,
      id: docId,
      admissionNumber: learnerData.admissionNumber || docId,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return docId;
  },

  async getLearners(): Promise<LearnerRecord[]> {
    const querySnapshot = await getDocs(collection(db, "learners"));
    return querySnapshot.docs.map(docSnapshot => {
      const id = docSnapshot.id;
      const data = docSnapshot.data();
      return {
        id: id,
        admissionNumber: data.admissionNumber || id,
        fullName: data.fullName || data.name || 'Unnamed Learner',
        ...data
      } as LearnerRecord;
    });
  },

  subscribeLearners(callback: (learners: LearnerRecord[]) => void) {
    return onSnapshot(collection(db, "learners"), (snapshot) => {
      const firestoreList = snapshot.docs.map(docSnapshot => {
        const id = docSnapshot.id;
        const data = docSnapshot.data();
        return {
          id: id,
          admissionNumber: data.admissionNumber || id,
          fullName: data.fullName || data.name || 'Unnamed Learner',
          ...data
        } as LearnerRecord;
      });

      const localList = JSON.parse(localStorage.getItem('learners') || localStorage.getItem('munyaka_students') || '[]');

      // Deduplicate by admission number or ID
      const mergedMap = new Map();
      [...localList, ...firestoreList].forEach(item => {
        const key = item.admissionNumber || item.id;
        if (key) mergedMap.set(key, item);
      });

      callback(Array.from(mergedMap.values()));
    }, (err) => {
      console.warn("Learners subscription error:", err);
    });
  }
};
