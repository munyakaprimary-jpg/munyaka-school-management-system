"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LearnerMasterList = () => {
  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Learner Master List</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is the Learner Master List view.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LearnerMasterList;