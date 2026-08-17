"use client";

import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import AppRouter from './routes'; // Corrected import path

const App = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
};

export default App;