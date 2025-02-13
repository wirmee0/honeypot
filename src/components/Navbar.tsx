'use client';
import React from 'react';

const Navbar = () => {
  return (
    <nav className="backdrop-blur-md bg-gradient-to-r from-secondary/80 to-secondary-lighter/50 border-b border-primary/20 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <img src="/logo.jpg" alt="logo" className="w-10 h-10 rounded-full shadow-md transition-transform group-hover:scale-110" />
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-75 transition duration-200"></div>
            </div>
            <div>
              <span className="text-primary font-bold text-2xl bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Honeypot Detector
              </span>
              <p className="text-xs text-primary/60">Secure your trades with confidence</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 