'use client';
import React from 'react';
import { NetworkSelector } from './NetworkSelector';

const Navbar = () => {
  return (
    <nav className="backdrop-blur-md bg-secondary-lighter/30 border-b border-primary/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="logo" className="w-8 h-8" />
            <span className="text-primary font-bold text-xl">Honeypot Detector</span>
          </div>
          
          <div className="flex items-center">
            <NetworkSelector />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 