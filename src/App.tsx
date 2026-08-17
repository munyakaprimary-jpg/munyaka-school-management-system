"use client";

import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import Routing from './components/Routing';

const App = () => {
  return (
    <Provider store={store}>
      <Routing />
    </Provider>
  );
};

export default App;