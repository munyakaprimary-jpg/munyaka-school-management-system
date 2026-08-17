"use client";

import React from 'react';
import { useEffect } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import routes from './routes';

const router = createBrowserRouter(routes);

const App = () => {
  useEffect(() => {
    // Your useEffect logic here
  }, []);

  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
};

export default App;