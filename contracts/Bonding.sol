// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

//get price manually by conversion rate instead of sushi
interface IConversionRate {
    function getRateOfToken(address token) external view returns (uint256);
}

contract PozBonding is Initializable, OwnableUpgradeable {
    uint256 public LOCK_PERIOD;
    uint256 public BOND_DISCOUNT;
    address public USDC_TREASURY_WALLET;
    address public POZ_TREASURY_WALLET;
    address public POZ;
    IConversionRate public conversion;

    // Info for bondable token
    struct Token {
        bool flag; // check it is set before
        uint256 totalLimit; // limit of bonding token
        uint256 walletLimit; // bondable token limit per wallet
        uint256 pendingAmount; // Amount of token on pending
    }

    // Info for bond holder
    struct Bond {
        uint256 price;
        uint256 amount;
        uint256 bondedAt;
        uint256 duration;
    }

    address[] tokens; // address of available bonding tokens
    mapping(address => Token) public tokenInfo; // stores bondable token information
    mapping(address => mapping(address => Bond[])) public bondInfo; // stores bond information for depositors according tokens
    mapping(address => mapping(address => uint16)) public lastIndex; // stores the last index of claimed Bond

    event POZ_purchased(
        address indexed _user,
        uint256 _price,
        uint256 _purchased_amount,
        uint256 _purchased_time,
        uint256 _lock_period
    );
    event POZ_claimed(
        address indexed _user,
        address _poz_treasury,
        uint256 _claimingAmount,
        uint256 _lastClaimedIndex
    );

    function initialize(
        address _conversion,
        address _poz,
        address _usdc_treasury,
        address _poz_treasury
    ) public initializer {
        conversion = IConversionRate(_conversion);
        POZ = _poz;
        USDC_TREASURY_WALLET = _usdc_treasury;
        POZ_TREASURY_WALLET = _poz_treasury;
        LOCK_PERIOD = 14 days;
        BOND_DISCOUNT = 1000;

        __Ownable_init();
    }

    function getBondableTokens() external view returns (address[] memory) {
        return tokens;
    }

    function getBondingTokenInfo(address _addr)
        external
        view
        returns (Token memory)
    {
        return tokenInfo[_addr];
    }

    function getClaimablePoz(address _user, address _addr)
        public
        view
        returns (uint256, uint16)
    {
        uint256 balance;
        uint16 ind = lastIndex[_user][_addr];
        uint256 decimals = ERC20(POZ).decimals();
        for (
            uint256 i = lastIndex[_user][_addr];
            i < bondInfo[_user][_addr].length;
            i++
        ) {
            Bond memory _temp = bondInfo[_user][_addr][i];
            if (getCurrentTime() >= _temp.bondedAt + _temp.duration) {
                balance += (_temp.price * _temp.amount) / (10**decimals);
                ind++;
            }
        }
        return (balance, ind);
    }

    function getBondingLength(address _user, address _addr)
        public
        view
        returns (uint256)
    {
        return bondInfo[_user][_addr].length;
    }

    function getCurrentTime() internal view virtual returns (uint256) {
        return block.timestamp;
    }

    function getPendingAmount(address _user, address _addr)
        internal
        view
        returns (uint256)
    {
        uint256 balance;
        for (uint256 i = 0; i < bondInfo[_user][_addr].length; i++) {
            balance = balance + bondInfo[_user][_addr][i].amount;
        }
        return balance;
    }

    function setPOZTokenContract(address _poz) external onlyOwner {
        POZ = _poz;
    }

    function setUSDCTreasuryWallet(address _usdcTreasury) external onlyOwner {
        USDC_TREASURY_WALLET = _usdcTreasury;
    }

    function setPOZTreasuryWallet(address _pozTreasury) external onlyOwner {
        POZ_TREASURY_WALLET = _pozTreasury;
    }

    function setConversionContract(address _conversion) external onlyOwner {
        conversion = IConversionRate(_conversion);
    }

    function setLockPeriod(uint256 _period) external onlyOwner {
        LOCK_PERIOD = _period;
    }

    function setBondTokenInfo(
        address _addr,
        uint256 _total,
        uint256 _limit
    ) external onlyOwner {
        if (tokenInfo[_addr].flag == false) {
            tokens.push(_addr);
        }
        uint256 _pending = tokenInfo[_addr].pendingAmount;
        tokenInfo[_addr] = Token(true, _total, _limit, _pending);
    }

    function setBondingDiscount(uint256 _discount) external onlyOwner {
        BOND_DISCOUNT = _discount;
    }

    // claim POZ token after vesting period
    function claimPOZ(address _addr) external {
        address _user = msg.sender;
        (uint256 _claim, uint16 _index) = getClaimablePoz(_user, _addr);
        require(_claim > 0, "PozBonding: nothing to claim.");
        ERC20(POZ).transferFrom(POZ_TREASURY_WALLET, _user, _claim);
        lastIndex[_user][_addr] = _index;
        emit POZ_claimed(
            _user,
            POZ_TREASURY_WALLET,
            _claim,
            lastIndex[_user][_addr]
        );
    }

    // purchase POZ token after approving USDC token
    function purchasePOZ(address _addr, uint256 _amount) external {
        address _user = msg.sender;
        require(
            tokenInfo[_addr].flag == true,
            "PozBonding: not in bonding list."
        );
        require(
            tokenInfo[_addr].totalLimit >=
                tokenInfo[_addr].pendingAmount + _amount,
            "PozBonding: total limit exceeds balance."
        );
        require(
            ERC20(_addr).balanceOf(_user) >= _amount,
            "PozBonding: insufficient balance."
        );
        uint256 _pending = getPendingAmount(_user, _addr);
        require(
            tokenInfo[_addr].walletLimit >= _pending + _amount,
            "PozBonding: bond limit per wallet exceeds balance."
        );

        uint256 _bond = conversion.getRateOfToken(_addr);
        ERC20(_addr).transferFrom(_user, USDC_TREASURY_WALLET, _amount);
        bondInfo[_user][_addr].push(
            Bond(_bond, _amount, getCurrentTime(), LOCK_PERIOD)
        );
        emit POZ_purchased(
            _user,
            _bond,
            _amount,
            getCurrentTime(),
            LOCK_PERIOD
        );
    }
}
