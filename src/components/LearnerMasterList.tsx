import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { setStudentCount } from '../app/actions';

const LearnerMasterList: React.FC = () => {
 const { count } = useSelector((state: RootState) => state.studentCount);

 useEffect(() => {
 // Simulate fetching data from the database
 const fetchStudentCount = async () => {
 const fetchedCount = 6; // Replace with your actual data fetching logic
 setStudentCount(fetchedCount)();
 };
 fetchStudentCount();
 }, [setStudentCount]);

 return (
 <div>
 <h3>Learner Master List</h3>
 <p>Active Records: {count}</p>
 </div>
 );
};

export default LearnerMasterList;