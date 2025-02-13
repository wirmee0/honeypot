'use client';
import React, { useState } from 'react';
import { NetworkSelector } from './NetworkSelector';

const Navbar = () => {
  const [selectedNetwork, setSelectedNetwork] = useState('unichainSepolia');

  return (
    <nav className="backdrop-blur-md bg-secondary-lighter/30 border-b border-primary/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <img src="/logo.jpg" alt="logo" className="w-8 h-8" />
            <span className="text-primary font-bold text-xl">Honeypot Detector</span>
          </div>
          
          <div className="flex items-center">
            <NetworkSelector 
              value={selectedNetwork} 
              onChange={setSelectedNetwork} 
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 