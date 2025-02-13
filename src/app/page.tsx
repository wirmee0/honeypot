import { TokenSearch } from '@/components/TokenSearch';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-secondary-darker">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <div className="relative pt-20 pb-40 px-4">
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">
            Honeypot Detector
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Instantly check if a token is a honeypot across multiple networks.
            Just paste the token address below.
          </p>
        </div>
        
        <TokenSearch />
      </div>
    </div>
  );
} 