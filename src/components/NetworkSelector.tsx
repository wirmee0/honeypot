'use client';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NETWORK_CONFIG } from '@/lib/blockchain';

type NetworkType = keyof typeof NETWORK_CONFIG;

interface NetworkSelectorProps {
  value: NetworkType;
  onChange: (value: NetworkType) => void;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as NetworkType)}>
      <SelectTrigger className="w-[180px] backdrop-blur-lg bg-secondary/20 border-primary/20 text-primary">
        <SelectValue placeholder="Select Network" />
      </SelectTrigger>
      <SelectContent className="backdrop-blur-xl bg-secondary/80 border-primary/20">
        <SelectItem value="unichainSepolia" className="text-primary hover:bg-primary/10">
          Unichain Sepolia ({NETWORK_CONFIG.unichainSepolia.currency})
        </SelectItem>
        <SelectItem value="unichain" className="text-primary hover:bg-primary/10">
          Unichain ({NETWORK_CONFIG.unichain.currency})
        </SelectItem>
        <SelectItem value="polygon" className="text-primary hover:bg-primary/10">
          Polygon ({NETWORK_CONFIG.polygon.currency})
        </SelectItem>
        <SelectItem value="arbitrum" className="text-primary hover:bg-primary/10">
          Arbitrum ({NETWORK_CONFIG.arbitrum.currency})
        </SelectItem>
      </SelectContent>
    </Select>
  );
}; 