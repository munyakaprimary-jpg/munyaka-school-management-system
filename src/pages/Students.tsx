import React, { useState, useEffect } from 'react';

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // Safely attempt backend or local storage read
        const localData = localStorage.getItem('munyaka_students') || localStorage.getItem('school_learners_data');
        if (localData) {
          const parsed = JSON.parse(localData);
          if (isMounted && Array.isArray(parsed)) {
            setStudents(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to parse student data", err);
        if (isMounted) setError("Could not load student list safely.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudents();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-600">Loading student directory...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Learner Directory</h1>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          Total: {students.length}
        </span>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      {students.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 border rounded-lg text-gray-500">
          No learner records found. Add a learner to get started.
        </div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Grade/Stream</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Admission No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student, idx) => (
                <tr key={student.id || idx}>
                  <td className="px-4 py-2 font-medium">{student.name || 'Unnamed Student'}</td>
                  <td className="px-4 py-2">{student.grade || 'N/A'} {student.stream || ''}</td>
                  <td className="px-4 py-2">{student.admNo || student.admissionNo || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
