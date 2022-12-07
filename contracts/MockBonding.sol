// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./Bonding.sol";

contract MockBonding is PozBonding {
    uint256 private currentTime;

    constructor(
        address _cr,
        address _poz,
        address _usdc_treasury,
        address _poz_treasury
    ) {
        initialize(_cr, _poz, _usdc_treasury, _poz_treasury);
    }

    function getCurrentTime() internal view virtual override returns (uint256) {
        return currentTime;
    }

    function setCurrentTime(uint256 time) public {
        currentTime = time;
    }
}
