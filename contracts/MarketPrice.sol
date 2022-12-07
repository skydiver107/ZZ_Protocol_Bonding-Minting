// SPDX-License-Identifier: MIT
pragma solidity >=0.7.5;
pragma abicoder v2;

import "@uniswap/v3-core/contracts/interfaces/IUniswapV3Factory.sol";
import "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import "./libraries/SushiSwap.sol";

contract MarketPrice {
    struct Pair {
        address token0;
        address token1;
        address pool;
    }

    Pair[] pairs;

    function addPairUsingUniV3(
        address factory,
        address token0,
        address token1,
        uint24 fee
    ) public {
        require(
            token0 != token1 && token0 != address(0) && token1 != address(0),
            "invalid pair"
        );
        address pool = IUniswapV3Factory(factory).getPool(token0, token1, fee);
        Pair memory pair = Pair(token0, token1, pool);
        require(pool != address(0), "pool not exists");
        pairs.push(pair);
    }

    function getPairs() public view returns (Pair[] memory) {
        return pairs;
    }

    function getMarketPriceUsingUniV3(
        address tokenIn,
        uint128 amountIn,
        uint32 secondsAgo
    ) external view returns (uint256 amountOut) {
        uint256 notExistIndex = 0;
        uint256 existIndex = 0;
        for (uint256 i = 0; i < pairs.length; i++) {
            Pair storage pair = pairs[i];
            if (pair.token0 != tokenIn || pair.token1 != tokenIn) {
                notExistIndex += 1;
            }
            if (pair.token0 == tokenIn || pair.token1 == tokenIn) {
                existIndex = i;
            }
        }
        require(notExistIndex != pairs.length - 1, "token not exists");
        address tokenOut = tokenIn == pairs[existIndex].token0
            ? pairs[existIndex].token1
            : pairs[existIndex].token0;
        (int24 tick, ) = OracleLibrary.consult(
            pairs[existIndex].pool,
            secondsAgo
        );
        amountOut = OracleLibrary.getQuoteAtTick(
            tick,
            amountIn,
            tokenIn,
            tokenOut
        );
    }

    function getMarketPriceUsingSushi(
        address factory,
        address tokenIn,
        address tokenOut,
        uint256 acmountIn
    ) external view returns (uint256) {
        (uint256 reserveA, uint256 reserveB) = SushiSwap.getReserves(
            factory,
            tokenIn,
            tokenOut
        );
        uint256 amountOut = SushiSwap.getAmountOut(
            acmountIn,
            reserveA,
            reserveB
        );
        return amountOut;
    }
}
