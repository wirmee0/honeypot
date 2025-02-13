'use client';
import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AnalysisProps {
  loading: boolean;
  results: any;
}

export const TokenAnalysis = ({ result }: { result: any }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(result).map(([key, value]: [string, any]) => {
          if (key === 'error' || key === 'isHoneypot') return null;
          
          return (
            <div
              key={key}
              className={`p-4 rounded-xl backdrop-blur-md border transition-all hover:shadow-lg
                ${value.safe 
                  ? 'bg-green-500/10 border-green-500/20' 
                  : 'bg-red-500/10 border-red-500/20'}`}
            >
              <h3 className="text-lg font-medium capitalize mb-2">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h3>
              
              <div className="flex items-center justify-between">
                <span className={`text-sm ${value.safe ? 'text-green-500' : 'text-red-500'}`}>
                  {value.message || (value.safe ? 'Safe' : 'Warning')}
                </span>
                {typeof value.value === 'number' && (
                  <span className="text-primary/60 text-sm">
                    {value.value.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {result.isHoneypot && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-center">
          <h3 className="text-xl font-bold text-red-500 mb-2">⚠️ Potential Honeypot Detected</h3>
          <p className="text-red-400">This token shows characteristics of a honeypot. Trade with extreme caution.</p>
        </div>
      )}

      {result.error && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-yellow-500">{result.error}</p>
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