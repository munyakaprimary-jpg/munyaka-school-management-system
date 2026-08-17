"use client";

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import SchoolManagementSystem from "./components/SchoolManagementSystem";

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<SchoolManagementSystem />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}