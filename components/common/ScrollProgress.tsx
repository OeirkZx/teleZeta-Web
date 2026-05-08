'use client';

import { useEffect, useState } from 'react';

export default function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      
      if (windowHeight === 0) {
        setScrollProgress(0);
        return;
      }
      
      const scroll = (totalScroll / windowHeight) * 100;
      setScrollProgress(scroll);
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger once on mount
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-transparent pointer-events-none">
      <div 
        className="h-full transition-all duration-150 ease-out"
        style={{ 
          width: `${scrollProgress}%`, 
          background: 'var(--blue-accent-light)',
          boxShadow: '0 0 10px rgba(106, 184, 232, 0.8)' 
        }}
      />
    </div>
  );
}
