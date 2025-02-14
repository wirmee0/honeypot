'use client';
import React from 'react';
import { NETWORK_CONFIG } from '@/lib/blockchain';

interface NetworkSelectorProps {
  value: string;
  onChange: (network: string) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ value, onChange }) => {
  // Define available networks and coming soon networks
  const availableNetworks = ['polygon', 'unichainSepolia'];
  const comingSoonNetworks = ['unichain', 'arbitrum'];

  return (
    <div className="flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary text-primary rounded-md px-3 py-2 text-sm"
      >
        {Object.entries(NETWORK_CONFIG).map(([key, config]) => (
          <option 
            key={key} 
            value={key}
            disabled={comingSoonNetworks.includes(key)}
            className={comingSoonNetworks.includes(key) ? 'text-gray-500' : ''}
          >
            {config.name} {comingSoonNetworks.includes(key) ? '(Coming Soon)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}; 