export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-primary">About Honeypot Detector</h1>
      
      <div className="space-y-4 text-gray-300">
        <p>
          Our honeypot detector helps you identify potentially malicious tokens across multiple blockchains.
          We currently support:
        </p>
        
        <ul className="list-disc list-inside space-y-2 ml-4">
          <li>Polygon Network</li>
          <li>Arbitrum Network</li>
          <li>UniChain Network</li>
        </ul>
        
        <h2 className="text-xl font-semibold text-primary mt-6">How it Works</h2>
        <p>
          Simply paste the token address you want to check. Our system will analyze the smart contract
          and transaction patterns to determine if the token exhibits honeypot characteristics.
        </p>
      </div>
    </div>
  );
} 