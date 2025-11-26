
import React, { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';

const App: React.FC = () => {
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-screen">
      <GameCanvas key={`${windowSize.w}-${windowSize.h}`} />
    </div>
  );
};

export default App;
