"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SchoolManagementSystem = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>School Management System</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the main view of the School Management System.</p>
          <Button variant="outline">Dashboard</Button>
          <Button variant="outline">Learner Master List</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolManagementSystem;