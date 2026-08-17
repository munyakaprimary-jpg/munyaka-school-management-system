import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { setStudentCount } from '../app/actions';

const Dashboard: React.FC = () => {
 const { count } = useSelector((state: RootState) => state.studentCount);

 useEffect(() => {
 // Simulate fetching data from the database
 const fetchStudentCount = async () => {
 const fetchedCount = 5; // Replace with your actual data fetching logic
 setStudentCount(fetchedCount)();
 };
 fetchStudentCount();
 }, [setStudentCount]);

 return (
 <div>
 <h3>Dashboard</h3>
 <p>Total Students: {count}</p>
 </div>
 );
};

export default Dashboard;