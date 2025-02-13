'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TokenAnalysis } from './TokenAnalysis';
import { checkHoneypot, NETWORK_CONFIG } from '@/lib/blockchain';
import { ethers } from 'ethers';
import { Search, AlertCircle } from 'lucide-react';
import { NetworkSelector } from './NetworkSelector';

// Define proper types
type NetworkType = keyof typeof NETWORK_CONFIG;

interface TokenSearchProps {
  className?: string;
}

interface TokenResult {
  canTransfer: { safe: boolean; message: string };
  hasBlacklist: { safe: boolean; message: string };
  hasPauseFunction: { safe: boolean; message: string };
  hasOwner: { safe: boolean; message: string };
  hasSellRestriction: { safe: boolean; message: string };
  hasAntiWhale: { safe: boolean; message: string };
  liquidity: { safe: boolean; message: string; value: number };
  error: string | null;
  isHoneypot: boolean;
}

export const TokenSearch: React.FC<TokenSearchProps> = () => {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TokenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkType>('unichainSepolia');

  const networkConfig = NETWORK_CONFIG[network];

  const handleNetworkChange = (newNetwork: NetworkType) => {
    setNetwork(newNetwork);
    setResult(null);
    setError(null);
  };

  const handleSearch = async (): Promise<void> => {
    if (!address.trim()) {
      setError('Please enter a token address');
      return;
    }

    if (!ethers.isAddress(address)) {
      setError('Invalid address format');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`Analyzing token on ${network} (Chain ID: ${networkConfig.chainId})...`);
      const result = await checkHoneypot(address, network);
      setResult(result as TokenResult);
    } catch (error: unknown) {
      console.error('Analysis error:', error);
      let errorMessage = 'Error analyzing token';
      
      if (error instanceof Error) {
        if (error.message.includes('Network chainId mismatch')) {
          errorMessage = `Network configuration error for ${network}. Please try again.`;
        } else if (error.message.includes('Unable to connect')) {
          errorMessage = `Network connection error: Unable to connect to ${network}. Please try again.`;
        } else if (error.message.includes('Not a contract address')) {
          errorMessage = `This address is not a smart contract on ${network}`;
        } else if (error.message.includes('Not a valid ERC20')) {
          errorMessage = 'This contract is not a valid ERC20 token';
        } else if (error.message.includes('Connection timeout')) {
          errorMessage = `Connection to ${network} timed out. Please try again.`;
        }
      }
      
      setError(errorMessage);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-secondary/20 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-primary/10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-primary/10">
            <div className="flex items-center gap-3">
              <NetworkSelector 
                value={network} 
                onChange={handleNetworkChange}
              />
              <span className="text-sm text-primary/60">
                Chain ID: {networkConfig.chainId}
              </span>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-primary mb-6 text-center">
            Check Token Safety
          </h2>
          
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter token address..."
              className="w-full px-4 py-3 bg-secondary/30 rounded-xl border border-primary/20 text-primary placeholder-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !address}
              className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium transition-all
                ${isLoading || !address ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:-translate-y-0.5'}`}
            >
              {isLoading ? 'Checking...' : 'Check'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6">
              <TokenAnalysis result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 