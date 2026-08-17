"use client";

import { Home } from "@/components/Home";
import { SchoolManagementSystem } from "@/components/SchoolManagementSystem";
import { LearnerMasterList } from "@/components/LearnerMasterList";

const routes = [
  { path: "/", component: SchoolManagementSystem },
  { path: "/dashboard", component: SchoolManagementSystem },
  { path: "/learnerMasterList", component: LearnerMasterList },
  // Add other routes here
];

export default routes;