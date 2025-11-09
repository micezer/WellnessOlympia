'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, User, Settings } from 'lucide-react';

const tabs = [
  { name: 'Home', icon: <Home size={20} /> },
  { name: 'Profile', icon: <User size={20} /> },
  { name: 'Settings', icon: <Settings size={20} /> },
];

const Navigation = () => {
  const [active, setActive] = useState(0);
  const [indicatorPos, setIndicatorPos] = useState(0);
  const containerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const tab = containerRef.current.children[active] as HTMLElement;
    setIndicatorPos(tab.offsetLeft + tab.offsetWidth / 2 - 25); // centrar burbuja
  }, [active]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-11/12 bg-white rounded-full shadow-lg p-1">
      <ul className="flex relative" ref={containerRef}>
        {/* Indicador burbuja animada */}
        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-0 w-20 h-14 bg-blue-600 rounded-full -translate-y-3 z-0"
          style={{ left: indicatorPos }}
        />

        {tabs.map((tab, i) => (
          <li key={i} className="flex-1 relative z-10">
            <button
              onClick={() => setActive(i)}
              className="flex flex-col items-center justify-center py-3 w-full"
            >
              <span
                className={`${
                  active === i
                    ? 'text-white scale-125 transition-transform duration-300'
                    : 'text-gray-400'
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`text-xs mt-1 ${
                  active === i ? 'text-white font-semibold' : 'text-gray-400'
                }`}
              >
                {tab.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Navigation;
