"use client";

import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import { Router } from '../routes'; // Correct import path

const App = () => {
  return (
    <Provider store={store}>
      <Router />
    </Provider>
  );
};

export default App;