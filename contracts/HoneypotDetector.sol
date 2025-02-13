// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function owner() external view returns (address);
    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8);
}

interface IUniswapV2Factory {
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Pair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

contract HoneypotDetector {
    struct TokenInfo {
        bool canTransfer;
        bool hasBlacklist;
        bool hasPauseFunction;
        bool hasOwner;
        bool hasSellRestriction;
        bool hasAntiWhale;
        uint256 liquidity;      // Added liquidity amount
        bool hasLiquidity;      // Added liquidity flag
        string error;
    }

    // Constants for Unichain Sepolia
    address constant FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address constant WETH = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;

    function detectHoneypot(address tokenAddress) external view returns (TokenInfo memory) {
        TokenInfo memory info;
        
        // Get the contract bytecode
        bytes memory bytecode;
        assembly {
            let size := extcodesize(tokenAddress)
            bytecode := mload(0x40)
            mstore(0x40, add(bytecode, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            mstore(bytecode, size)
            extcodecopy(tokenAddress, add(bytecode, 0x20), 0, size)
        }

        // Check for sell restriction patterns
        bytes4[] memory sellRestrictionSignatures = new bytes4[](5);
        sellRestrictionSignatures[0] = bytes4(keccak256("_beforeTokenTransfer(address,address,uint256)"));
        sellRestrictionSignatures[1] = bytes4(keccak256("_beforeTransfer(address,address,uint256)"));
        sellRestrictionSignatures[2] = bytes4(keccak256("isExcludedFromFee(address)"));
        sellRestrictionSignatures[3] = bytes4(keccak256("isSellAllowed(address)"));
        sellRestrictionSignatures[4] = bytes4(keccak256("sellEnabled()"));

        // Look for suspicious patterns in transfer function
        bytes[] memory suspiciousPatterns = new bytes[](3);
        suspiciousPatterns[0] = hex"3d3d3d3d"; // CALLER check pattern
        suspiciousPatterns[1] = hex"73"; // PUSH20 (address comparison)
        suspiciousPatterns[2] = hex"14"; // EQ opcode after address comparison

        // Check for sell restrictions in bytecode
        for (uint i = 0; i < sellRestrictionSignatures.length; i++) {
            if (containsFunction(bytecode, sellRestrictionSignatures[i])) {
                info.hasSellRestriction = true;
                break;
            }
        }

        // Check for suspicious patterns that might indicate hidden sell restrictions
        for (uint i = 0; i < suspiciousPatterns.length; i++) {
            if (contains(bytecode, suspiciousPatterns[i], 0)) {
                info.hasSellRestriction = true;
                break;
            }
        }

        // Check for anti-whale mechanics (often used to prevent selling)
        bytes4[] memory antiWhaleSignatures = new bytes4[](4);
        antiWhaleSignatures[0] = bytes4(keccak256("maxTxAmount()"));
        antiWhaleSignatures[1] = bytes4(keccak256("_maxTxAmount()"));
        antiWhaleSignatures[2] = bytes4(keccak256("maxTransferAmount()"));
        antiWhaleSignatures[3] = bytes4(keccak256("maxSellAmount()"));

        for (uint i = 0; i < antiWhaleSignatures.length; i++) {
            if (containsFunction(bytecode, antiWhaleSignatures[i])) {
                info.hasAntiWhale = true;
                break;
            }
        }

        // Check for blacklist functions
        bytes4[] memory blacklistSignatures = new bytes4[](3);
        blacklistSignatures[0] = bytes4(keccak256("blacklist(address)"));
        blacklistSignatures[1] = bytes4(keccak256("addBlacklist(address)"));
        blacklistSignatures[2] = bytes4(keccak256("setBlacklist(address,bool)"));

        for (uint i = 0; i < blacklistSignatures.length; i++) {
            if (containsFunction(bytecode, blacklistSignatures[i])) {
                info.hasBlacklist = true;
                break;
            }
        }

        // Check for pause functions
        bytes4[] memory pauseSignatures = new bytes4[](3);
        pauseSignatures[0] = bytes4(keccak256("pause()"));
        pauseSignatures[1] = bytes4(keccak256("unpause()"));
        pauseSignatures[2] = bytes4(keccak256("setPaused(bool)"));

        for (uint i = 0; i < pauseSignatures.length; i++) {
            if (containsFunction(bytecode, pauseSignatures[i])) {
                info.hasPauseFunction = true;
                break;
            }
        }

        // Check if contract has owner
        try IERC20(tokenAddress).owner() returns (address owner) {
            info.hasOwner = owner != address(0);
        } catch {
            // No owner function, that's fine
        }

        // Test transfer functionality
        try IERC20(tokenAddress).balanceOf(address(this)) returns (uint256) {
            info.canTransfer = true;
        } catch {
            info.error = "Cannot read balance";
            info.canTransfer = false;
        }

        // Check liquidity (fixed try-catch syntax)
        try IUniswapV2Factory(FACTORY).getPair(tokenAddress, WETH) returns (address pair) {
            if (pair != address(0)) {
                try IUniswapV2Pair(pair).token0() returns (address token0) {
                    try IUniswapV2Pair(pair).getReserves() returns (uint112 reserve0, uint112 reserve1, uint32) {
                        try IERC20(tokenAddress).decimals() returns (uint8 decimals) {
                            // Calculate liquidity in terms of token amount
                            uint256 tokenReserve = token0 == tokenAddress ? reserve0 : reserve1;
                            info.liquidity = tokenReserve;
                            
                            // Consider having liquidity if more than 1000 tokens (adjusted for decimals)
                            info.hasLiquidity = tokenReserve >= 1000 * (10 ** decimals);
                        } catch {
                            info.error = string(abi.encodePacked(info.error, " Failed to get decimals."));
                        }
                    } catch {
                        info.error = string(abi.encodePacked(info.error, " Failed to get reserves."));
                    }
                } catch {
                    info.error = string(abi.encodePacked(info.error, " Failed to get token0."));
                }
            } else {
                info.hasLiquidity = false;
                info.liquidity = 0;
            }
        } catch {
            info.error = string(abi.encodePacked(info.error, " Failed to check liquidity."));
            info.hasLiquidity = false;
            info.liquidity = 0;
        }

        return info;
    }

    function contains(bytes memory haystack, bytes memory needle, uint256 offset) internal pure returns (bool) {
        if (needle.length > haystack.length - offset) {
            return false;
        }

        for (uint i = 0; i < needle.length; i++) {
            if (haystack[offset + i] != needle[i]) {
                return false;
            }
        }
        return true;
    }

    function containsFunction(bytes memory bytecode, bytes4 signature) internal pure returns (bool) {
        for (uint i = 0; i < bytecode.length - 3; i++) {
            bytes4 functionSig;
            assembly {
                functionSig := mload(add(add(bytecode, 0x20), i))
            }
            if (functionSig == signature) {
                return true;
            }
        }
        return false;
    }
} 