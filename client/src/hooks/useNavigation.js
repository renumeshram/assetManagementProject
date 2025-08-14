import { useState } from 'react';

const useNavigation = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  
  const navigate = (view) => {
    setCurrentView(view);
  };
  
  return { currentView, navigate };
};

export { useNavigation };