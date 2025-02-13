'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TokenAnalysis } from './TokenAnalysis';
import { checkHoneypot, NETWORK_CONFIG, type NetworkConfig } from '@/lib/blockchain';
import { ethers } from 'ethers';
import { Search, AlertCircle } from 'lucide-react';
import { NetworkSelector } from './NetworkSelector';

type NetworkType = keyof typeof NETWORK_CONFIG;

interface TokenSearchProps {
  className?: string;
}

export const TokenSearch: React.FC<TokenSearchProps> = () => {
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [network, setNetwork] = useState<NetworkType>('unichainSepolia');

  const networkConfig = NETWORK_CONFIG[network];

  const handleSearch = async (): Promise<void> => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    if (!ethers.isAddress(tokenAddress)) {
      setError('Invalid address format');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      console.log(`Analyzing token on ${network} (Chain ID: ${networkConfig.chainId})...`);
      const result = await checkHoneypot(tokenAddress, network);
      setResults(result);
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
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNetworkChange = (newNetwork: NetworkType) => {
    setNetwork(newNetwork);
    setResults(null);
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="backdrop-blur-xl bg-secondary/20 p-6 rounded-2xl border border-primary/10 shadow-lg">
        <div className="flex gap-4 mb-4 items-center">
          <NetworkSelector 
            value={network} 
            onChange={handleNetworkChange}
          />
          <span className="text-sm text-gray-400">
            Chain ID: {networkConfig.chainId}
          </span>
        </div>
        
        <div className="relative">
          <Input
            placeholder="Paste token address here..."
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="bg-secondary/40 border-primary/20 text-white pl-12 h-14 text-lg rounded-xl"
          />
          <Search className="absolute left-4 top-4 text-primary/60 w-6 h-6" />
          <Button 
            onClick={handleSearch}
            disabled={loading}
            className="absolute right-2 top-2 bg-primary hover:bg-primary-light text-secondary font-bold h-10 rounded-lg"
          >
            {loading ? 'Analyzing...' : 'Check Token'}
          </Button>
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="text-red-500 w-5 h-5" />
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>

      {(loading || results) && (
        <div className="backdrop-blur-xl bg-secondary/20 rounded-2xl border border-primary/10 shadow-lg">
          <TokenAnalysis loading={loading} results={results} />
        </div>
      )}
    </div>
  );
}; 