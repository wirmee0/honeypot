'use client';
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AnalysisProps {
  loading: boolean;
  results: any;
}

export const TokenAnalysis = ({ loading, results }: AnalysisProps) => {
  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-secondary/40 rounded-lg w-3/4"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-secondary/40 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-primary">Analysis Results</h3>
        <div className={`px-6 py-2 rounded-full backdrop-blur-md ${
          results.isHoneypot 
            ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
            : 'bg-green-500/10 text-green-500 border border-green-500/20'
        }`}>
          {results.isHoneypot ? 'Potential Honeypot' : 'Likely Safe'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CheckItem
          label="Buy Tax"
          safe={results.buyTax?.safe}
          message={`${results.buyTax?.tax}%`}
        />
        <CheckItem
          label="Sell Tax"
          safe={results.sellTax?.safe}
          message={`${results.sellTax?.tax}%`}
        />
        <CheckItem
          label="Liquidity"
          safe={results.liquidity?.safe}
          message={`$${results.liquidity?.value}`}
        />
        <CheckItem
          label="Ownership"
          safe={results.ownershipRenounced?.safe}
          message={results.ownershipRenounced?.message}
        />
        <CheckItem
          label="Blacklist"
          safe={!results.hasBlacklist?.safe}
          message={results.hasBlacklist?.message}
        />
        <CheckItem
          label="Transfers"
          safe={results.canTransfer?.safe}
          message={results.canTransfer?.message}
        />
      </div>

      {results.warnings?.length > 0 && (
        <div className="mt-6 p-6 backdrop-blur-md bg-red-500/5 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-2 text-red-500 mb-3">
            <AlertTriangle className="w-5 h-5" />
            <h4 className="font-semibold">Warnings</h4>
          </div>
          <ul className="space-y-2">
            {results.warnings.map((warning: string, index: number) => (
              <li key={index} className="text-sm text-red-400 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-red-500"></span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CheckItem = ({ label, safe, message }: { label: string, safe: boolean, message: string }) => (
  <div className="flex items-center justify-between p-4 backdrop-blur-md bg-secondary/40 rounded-xl border border-primary/10">
    <div className="flex items-center gap-3">
      {safe ? (
        <CheckCircle className="w-6 h-6 text-green-500" />
      ) : (
        <XCircle className="w-6 h-6 text-red-500" />
      )}
      <span className="font-medium">{label}</span>
    </div>
    <span className="text-sm px-3 py-1 rounded-full backdrop-blur-sm bg-secondary/40">
      {message}
    </span>
  </div>
); 