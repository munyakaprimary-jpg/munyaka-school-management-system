"use client";

import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Index"; // Assuming Index is located in src/pages Index.tsx
import { GradesAndStreamsProvider } from "@/Providers/GradesAndStreamsProvider";

const router = createBrowserRouter([
  {
    path: "*",
    element: <Home />,
  }
]);

export default function App() {

  return (
    <>
      <GradesAndStreamsProvider>
        <RouterProvider router={router} />
      </GradesAndStreamsProvider>
    </>
  );
}