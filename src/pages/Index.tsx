import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome',
  description: 'This is the home page',
};

const Home = () => (
  <div>
    <h1>Welcome to My App</h1>
    <p>This is the landing/home page.</p>
  </div>
);

export default Home;