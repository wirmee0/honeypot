import { ethers } from 'ethers';

// Extended ERC20 ABI to include common honeypot-related functions
const ERC20_ABI = [
  // Standard ERC20
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address,uint256) returns (bool)',
  // Owner/Control functions
  'function owner() view returns (address)',
  'function getOwner() view returns (address)',
  'function isExcludedFromFee(address) view returns (bool)',
  // Trading control functions
  'function maxTransactionAmount() view returns (uint256)',
  'function maxWalletSize() view returns (uint256)',
  // Fee related
  'function buyFee() view returns (uint256)',
  'function sellFee() view returns (uint256)',
  // Router/Pair info
  'function uniswapV2Pair() view returns (address)',
  'function WETH() view returns (address)',
  // Add these for pair/liquidity detection
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function factory() external view returns (address)',
  // For V2 pairs
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairs(uint) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)'
] as const;

// Define network configuration type
export type NetworkConfig = {
  chainId: number;
  name: string;
  currency: string;
  wethAddress: string;
};

// Export network config with type
export const NETWORK_CONFIG: Record<string, NetworkConfig> = {
  polygon: {
    chainId: 137,
    name: 'polygon',
    currency: 'MATIC',
    wethAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
  },
  arbitrum: {
    chainId: 42161,
    name: 'arbitrum',
    currency: 'ETH',
    wethAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
  },
  unichain: {
    chainId: 130,
    name: 'unichain',
    currency: 'UNW',
    wethAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
  },
  unichainSepolia: {
    chainId: 1301,
    name: 'Unichain Sepolia',
    currency: 'ETH',
    wethAddress: '0x4200000000000000000000000000000000000006'
  }
} as const;

// Update RPC endpoints with fallbacks
const RPC_URLS = {
  polygon: [process.env.POLYGON_RPC!],
  arbitrum: [process.env.ARBITRUM_RPC!],
  unichain: [process.env.UNICHAIN_MAINNET_RPC!],
  unichainSepolia: [
    'https://sepolia.unichain.org',  // Primary RPC
    process.env.UNICHAIN_SEPOLIA_RPC!,  // Fallback
  ]
};

// Update the detector ABI to match the verified contract
const DETECTOR_ABI = [
  {
    inputs: [{
      internalType: "address",
      name: "tokenAddress",
      type: "address"
    }],
    name: "detectHoneypot",
    outputs: [{
      components: [
        {
          internalType: "bool",
          name: "canTransfer",
          type: "bool"
        },
        {
          internalType: "bool",
          name: "hasBlacklist",
          type: "bool"
        },
        {
          internalType: "bool",
          name: "hasPauseFunction",
          type: "bool"
        },
        {
          internalType: "bool",
          name: "hasOwner",
          type: "bool"
        },
        {
          internalType: "bool",
          name: "hasSellRestriction",
          type: "bool"
        },
        {
          internalType: "bool",
          name: "hasAntiWhale",
          type: "bool"
        },
        {
          internalType: "uint256",
          name: "liquidity",
          type: "uint256"
        },
        {
          internalType: "bool",
          name: "hasLiquidity",
          type: "bool"
        },
        {
          internalType: "string",
          name: "error",
          type: "string"
        }
      ],
      internalType: "struct HoneypotDetector.TokenInfo",
      name: "",
      type: "tuple"
    }],
    stateMutability: "view",
    type: "function"
  }
] as const;

const DETECTOR_ADDRESSES = {
  polygon: '0x...',
  arbitrum: '0x...',
  unichain: '0x...',
  unichainSepolia: '0xB1FFBAB3836908459f6f0f795dd1D978e9CB8818'
};

// Define router interfaces and addresses
interface RouterAddresses {
  v2?: string;
  v3?: string;
  v4?: string;
}

const ROUTER_ADDRESSES: Record<string, RouterAddresses> = {
  polygon: {
    v2: process.env.POLYGON_ROUTER
  },
  arbitrum: {
    v2: process.env.ARBITRUM_ROUTER
  },
  unichain: {
    v2: process.env.UNICHAIN_ROUTER
  },
  unichainSepolia: {
    v2: process.env.UNICHAIN_SEPOLIA_ROUTER_V2,
    v3: process.env.UNICHAIN_SEPOLIA_ROUTER_V3,
    v4: process.env.UNICHAIN_SEPOLIA_ROUTER_V4
  }
};

// For V3 price quotes
const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external view returns (uint256 amountOut)'
];

// Add network-specific factory addresses
const FACTORY_ADDRESSES = {
  polygon: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
  arbitrum: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  unichain: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  unichainSepolia: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'  // Verify this is correc
} as const;

export const checkHoneypot = async (tokenAddress: string, network: string) => {
  try {
    console.log(`Checking token ${tokenAddress} on ${network}`);
    
    const networkConfig = NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG];
    const urls = RPC_URLS[network as keyof typeof RPC_URLS];
    let provider: ethers.JsonRpcProvider | null = null;
    let lastError: Error | null = null;

    // Try each RPC URL until one works
    for (const url of urls) {
      try {
        provider = new ethers.JsonRpcProvider(url, {
          chainId: networkConfig.chainId,
          name: networkConfig.name
        });

        // Test the connection with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 10000)
        );
        const networkPromise = provider.getNetwork();
        
        await Promise.race([networkPromise, timeoutPromise]);
        console.log(`Connected to ${network} via ${url}`);
        break;
      } catch (e) {
        console.log(`Failed to connect to ${url}:`, e);
        lastError = e as Error;
        continue;
      }
    }

    if (!provider) {
      throw new Error(`Unable to connect to ${network}. Please try again later. ${lastError?.message}`);
    }

    // First check if it's a contract
    const code = await provider.getCode(tokenAddress);
    if (code === '0x' || code === '0x0') {
      throw new Error('Not a contract address');
    }

    // Connect to token contract for additional checks
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

    // Connect to detector contract
    const detector = new ethers.Contract(
      DETECTOR_ADDRESSES[network as keyof typeof DETECTOR_ADDRESSES],
      DETECTOR_ABI,
      provider
    );

    // Run all checks in parallel
    const [
      detectorInfo,
      buyTaxInfo,
      sellTaxInfo,
      liquidityInfo,
      ownershipInfo
    ] = await Promise.all([
      detector.detectHoneypot(tokenAddress),
      checkBuyTax(tokenContract, network),
      checkSellTax(tokenContract),
      checkLiquidity(tokenContract, network),
      checkOwnershipRenounced(tokenContract)
    ]);
    
    return {
      canTransfer: {
        safe: detectorInfo.canTransfer,
        message: !detectorInfo.canTransfer ? 'Token cannot be transferred' : ''
      },
      hasBlacklist: {
        safe: !detectorInfo.hasBlacklist,
        message: detectorInfo.hasBlacklist ? 'Contract has blacklist functionality' : ''
      },
      hasPauseFunction: {
        safe: !detectorInfo.hasPauseFunction,
        message: detectorInfo.hasPauseFunction ? 'Trading can be paused by owner' : ''
      },
      hasOwner: {
        safe: !detectorInfo.hasOwner,
        message: detectorInfo.hasOwner ? 'Contract has an owner with special privileges' : ''
      },
      hasSellRestriction: {
        safe: !detectorInfo.hasSellRestriction,
        message: detectorInfo.hasSellRestriction ? 'Token has sell restrictions' : ''
      },
      hasAntiWhale: {
        safe: !detectorInfo.hasAntiWhale,
        message: detectorInfo.hasAntiWhale ? 'Token has anti-whale mechanics' : ''
      },
      liquidity: {
        safe: detectorInfo.hasLiquidity,
        message: !detectorInfo.hasLiquidity ? 'Insufficient liquidity' : '',
        value: Number(detectorInfo.liquidity)
      },
      ownership: ownershipInfo,
      error: detectorInfo.error || null,
      isHoneypot: (
        (!detectorInfo.canTransfer && detectorInfo.error === '') || 
        (detectorInfo.hasBlacklist && detectorInfo.hasPauseFunction) || 
        (detectorInfo.hasSellRestriction && !detectorInfo.hasLiquidity) || 
        !detectorInfo.hasLiquidity
      )
    };
  } catch (error: any) {
    console.error('Error in checkHoneypot:', error);
    throw error;
  }
};

// Individual check functions
async function checkBuyTax(contract: ethers.Contract, network: string) {
  try {
    const routers = ROUTER_ADDRESSES[network];
    let bestTax = 100; // Start with worst case
    let routerUsed = '';

    // Try each available router
    for (const [version, address] of Object.entries(routers)) {
      if (!address) continue;

      try {
        const tax = await simulateBuyTax(contract, address, version);
        if (tax < bestTax) {
          bestTax = tax;
          routerUsed = version;
        }
      } catch (e) {
        console.log(`Failed to check tax with ${version} router:`, e);
        continue;
      }
    }

    return {
      safe: bestTax <= 10, // Consider unsafe if tax > 10%
      message: bestTax > 10 ? `High buy tax: ${bestTax.toFixed(2)}% (${routerUsed})` : '',
      tax: Number(bestTax.toFixed(2))
    };
  } catch (error) {
    console.error('Error checking buy tax:', error);
    return { safe: false, message: 'Unable to verify buy tax', tax: 0 };
  }
}

async function checkSellTax(contract: ethers.Contract) {
  try {
    let sellTax = 0;
    try {
      sellTax = await contract.sellFee();
      sellTax = Number(sellTax) / 100;
    } catch {
      // Get provider safely
      if (!contract.provider || !(contract.provider instanceof ethers.JsonRpcProvider)) {
        throw new Error('Invalid provider');
      }
      const bytecode = await contract.provider.getCode(contract.target);
      sellTax = analyzeBytecodeForFees(bytecode);
    }

    return {
      safe: sellTax <= 10,
      message: sellTax > 10 ? `High sell tax: ${sellTax}%` : '',
      tax: sellTax
    };
  } catch (error) {
    return { safe: false, message: 'Unable to verify sell tax', tax: 100 };
  }
}

async function checkLiquidity(contract: ethers.Contract, network: string) {
  try {
    const pairAddress = await findPairAddress(contract, network);
    
    if (!pairAddress) {
      console.log('No liquidity pool found');
      return { safe: false, message: 'No liquidity pool found', value: 0 };
    }

    // Create a new provider for production
    const provider = new ethers.JsonRpcProvider('https://sepolia.unichain.org', {
      chainId: NETWORK_CONFIG[network].chainId,
      name: NETWORK_CONFIG[network].name
    });

    // Get pair contract with new provider
    const pairContract = new ethers.Contract(
      pairAddress,
      [
        'function token0() external view returns (address)',
        'function token1() external view returns (address)',
        'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
      ],
      provider // Use the new provider
    );

    // Create token contract with new provider
    const tokenContract = new ethers.Contract(
      contract.target,
      ['function decimals() view returns (uint8)'],
      provider
    );

    // Get token positions
    const token0 = await pairContract.token0();
    const reserves = await pairContract.getReserves();
    const tokenDecimals = await tokenContract.decimals();
    
    // Calculate liquidity
    const tokenReserve = token0.toLowerCase() === contract.target.toLowerCase() ? 
      reserves[0] : reserves[1];
    
    const liquidityAmount = Number(tokenReserve) / (10 ** tokenDecimals);
    const isSafe = liquidityAmount >= 1000;
    
    return {
      safe: isSafe,
      message: isSafe ? '' : 'Low liquidity',
      value: liquidityAmount
    };
  } catch (error) {
    console.error('Error checking liquidity:', error);
    return { safe: false, message: 'Unable to verify liquidity', value: 0 };
  }
}

async function checkOwnershipRenounced(contract: ethers.Contract) {
  try {
    let owner;
    try {
      owner = await contract.owner();
    } catch {
      try {
        owner = await contract.getOwner();
      } catch {
        return { safe: true, message: 'No owner function found' };
      }
    }

    const zeroAddress = '0x0000000000000000000000000000000000000000';
    const isRenounced = owner === zeroAddress;

    return {
      safe: isRenounced,
      message: isRenounced ? '' : 'Contract ownership not renounced'
    };
  } catch (error) {
    return { safe: false, message: 'Unable to verify ownership' };
  }
}

async function checkBlacklist(contract: ethers.Contract) {
  try {
    // Get provider safely
    if (!contract.provider || !(contract.provider instanceof ethers.JsonRpcProvider)) {
      throw new Error('Invalid provider');
    }
    const bytecode = await contract.provider.getCode(contract.target);
    const hasBlacklistFunction = checkForBlacklistFunctions(bytecode);

    return {
      safe: !hasBlacklistFunction,
      message: hasBlacklistFunction ? 'Contract contains blacklist functions' : ''
    };
  } catch (error) {
    return { safe: false, message: 'Unable to verify blacklist' };
  }
}

async function checkTransferPause(contract: ethers.Contract) {
  try {
    // Get provider safely
    if (!contract.provider || !(contract.provider instanceof ethers.JsonRpcProvider)) {
      throw new Error('Invalid provider');
    }
    const bytecode = await contract.provider.getCode(contract.target);
    const hasPauseFunction = checkForPauseFunctions(bytecode);

    return {
      safe: !hasPauseFunction,
      message: hasPauseFunction ? 'Transfers can be paused by owner' : ''
    };
  } catch (error) {
    return { safe: false, message: 'Unable to verify transfer pause' };
  }
}

async function checkMaxTransaction(contract: ethers.Contract) {
  try {
    let maxAmount;
    try {
      maxAmount = await contract.maxTransactionAmount();
    } catch {
      try {
        maxAmount = await contract.maxWalletSize();
      } catch {
        return { safe: true, message: 'No transaction limits found', limit: '∞' };
      }
    }

    const totalSupply = await contract.totalSupply();
    const maxPercentage = (Number(maxAmount) / Number(totalSupply)) * 100;

    return {
      safe: maxPercentage >= 1, // Consider safe if max tx is at least 1% of supply
      message: maxPercentage < 1 ? 'Low maximum transaction limit' : '',
      limit: `${maxPercentage.toFixed(2)}%`
    };
  } catch (error) {
    return { safe: false, message: 'Unable to verify transaction limits', limit: '0' };
  }
}

// Helper functions
function analyzeBytecodeForFees(bytecode: string): number {
  // Implement bytecode analysis for fee detection
  // This is a simplified version
  return 0;
}

function checkForBlacklistFunctions(bytecode: string): boolean {
  // Check for common blacklist function signatures
  const blacklistSignatures = [
    'blacklist(address)',
    'addBlacklist(address)',
    'setBlacklist(address,bool)'
  ];
  return blacklistSignatures.some(sig => bytecode.includes(ethers.id(sig).slice(2, 10)));
}

function checkForPauseFunctions(bytecode: string): boolean {
  // Check for common pause function signatures
  const pauseSignatures = [
    'pause()',
    'unpause()',
    'setPaused(bool)'
  ];
  return pauseSignatures.some(sig => bytecode.includes(ethers.id(sig).slice(2, 10)));
}

async function findPairAddress(contract: ethers.Contract, network: string): Promise<string | null> {
  try {
    const FACTORY_ADDRESS = FACTORY_ADDRESSES[network as keyof typeof FACTORY_ADDRESSES];
    if (!FACTORY_ADDRESS) {
      console.error('Factory address not found for network:', network);
      return null;
    }

    const wethAddress = NETWORK_CONFIG[network].wethAddress;
    
    console.log('Checking pair with:', {
      factory: FACTORY_ADDRESS,
      weth: wethAddress,
      token: contract.target
    });

    // Create a new provider instance
    const provider = new ethers.JsonRpcProvider('https://sepolia.unichain.org', {
      chainId: NETWORK_CONFIG[network].chainId,
      name: NETWORK_CONFIG[network].name
    });

    // Create factory contract with new provider
    const factoryContract = new ethers.Contract(
      FACTORY_ADDRESS,
      ['function getPair(address,address) view returns (address)'],
      provider
    );

    try {
      // Try token/WETH order
      const pair = await factoryContract.getPair(contract.target, wethAddress);
      if (pair && pair !== '0x0000000000000000000000000000000000000000') {
        console.log('Found pair:', pair);
        return pair;
      }

      // Try WETH/token order
      const pairReverse = await factoryContract.getPair(wethAddress, contract.target);
      if (pairReverse && pairReverse !== '0x0000000000000000000000000000000000000000') {
        console.log('Found pair (reverse order):', pairReverse);
        return pairReverse;
      }

      console.log('No liquidity pool found');
      return null;
    } catch (e) {
      console.error('Factory check failed:', e);
      return null;
    }
  } catch (error) {
    console.error('Error finding pair address:', error);
    return null;
  }
}

async function getLiquidityValue(contract: ethers.Contract, pairAddress: string): Promise<number> {
  // Implement liquidity value calculation
  return 0;
}

// Add more suspicious patterns to check in the contract
const suspiciousPatterns = [
  '0x3d3d3d3d', // CALLER check pattern
  '0x73',       // PUSH20 (address comparison)
  '0x14',       // EQ opcode after address comparison
  '0x33',       // CALLER opcode
  '0x3373',     // CALLER followed by PUSH20
  '0x18',       // XOR opcode (possible hidden logic)
  '0x60806040', // Common proxy pattern
  '0x5b',       // JUMPDEST (many of these could indicate complex flow control)
];

// Add more function signatures to check
const suspiciousFunctions = [
  'setTradingEnabled(bool)',
  'enableTrading()',
  'setMaxWallet(uint256)',
  'setMaxTransactionAmount(uint256)',
  'setFees(uint256)',
  'updateFees(uint256)',
  'setTaxes(uint256,uint256)',
  'excludeFromFees(address)',
  'includeInFees(address)',
  'setFeeExempt(address,bool)'
];

// Helper function to convert hex string to bytes
function hexToBytes(hex: string): Uint8Array {
  hex = hex.replace('0x', '');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function contains(bytecode: string, pattern: string, offset: number): boolean {
  const bytecodeBytes = hexToBytes(bytecode);
  const patternBytes = hexToBytes(pattern);

  if (patternBytes.length > bytecodeBytes.length - offset) {
    return false;
  }

  for (let i = 0; i < patternBytes.length; i++) {
    if (bytecodeBytes[offset + i] !== patternBytes[i]) {
      return false;
    }
  }
  return true;
}

// Simulate buy tax for different router versions
async function simulateBuyTax(
  contract: ethers.Contract, 
  routerAddress: string, 
  version: string
): Promise<number> {
  try {
    if (version === 'v2') {
      // V2 logic remains the same
      const routerABI = [
        'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
        'function WETH() view returns (address)'
      ];
      const router = new ethers.Contract(routerAddress, routerABI, contract.provider);
      const wethAddress = await router.WETH();
      const amountIn = ethers.parseEther('1');
      const path = [wethAddress, await contract.getAddress()];
      const amounts = await router.getAmountsOut(amountIn, path);
      return calculateTax(amounts[1], await contract.balanceOf(ethers.ZeroAddress));
    } 
    else if (version === 'v3') {
      // Use Quoter contract for V3
      const quoter = new ethers.Contract(
        process.env.UNICHAIN_SEPOLIA_QUOTER_V3!,
        QUOTER_ABI,
        contract.provider
      );
      const router = new ethers.Contract(routerAddress, ['function WETH9() view returns (address)'], contract.provider);
      const wethAddress = await router.WETH9();
      const amountIn = ethers.parseEther('1');
      const expectedOut = await quoter.quoteExactInputSingle(
        wethAddress,
        await contract.getAddress(),
        3000, // Default fee tier
        amountIn,
        0
      );
      return calculateTax(expectedOut, await contract.balanceOf(ethers.ZeroAddress));
    }
    // V4 implementation can be added later
    return 0;
  } catch (error) {
    console.error(`Error in ${version} tax simulation:`, error);
    return 0;
  }
}

function calculateTax(expected: bigint, actual: bigint): number {
  return Number(((expected - actual) * BigInt(100)) / expected);
} 