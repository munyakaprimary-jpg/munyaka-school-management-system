"use client";

import Home from "./pages/Home";
import About from "./pages/About";
import { Route, Routes } from "react-router-dom";

const routes: React.ReactNode[] = [
  <Route path="/" element={<Home />} />,
  <Route path="/about" element={<About />} />,
];

export default routes;