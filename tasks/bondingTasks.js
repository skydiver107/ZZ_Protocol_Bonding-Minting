/*
mainet 
conversionRate contract deployed to  0x540753b6b1Eca897A887949F1129F972b9731F32
Bonding contract deployed to  0x22898207DadE6ab8e7E591ec88fe4A10ad570f97
*/
module.exports = async function (taskArgs, hre) {
  let pozTokenAddress;
  let conversionRateAddress;
  let treasuryWallet;
  let bondingContract;

  if (hre.network.name === "mumbai") {
    pozTokenAddress = "0x6cb90f5595f4aE1a9Dd25f12c7701247E36B54e8"
    conversionRateAddress = '0x028dAF6b0772fdd778fb951149eCDe872A9552c3'
    treasuryWallet = '0x231269e71311624cA6594E908c12AEc47BcA9b24'
    bondingContract = '0x3b37D62C231935e51850FE93c7ec83A6afb8110b'
    usdcContract = '0xc44556Cc482126b5c4C4093de521F8C13302FBa3'
  } else if (hre.network.name === "polygon") {
    pozTokenAddress = '0x701fD77F1B00547BE745957Ddf1cc92F9D088B6B'
    conversionRateAddress = '0xD78B584dA0DE77A4cA59aF96F03eC17E5d305f4e'
    treasuryWallet = '0x41B002E9D253A062acE0c698cd3F936B0c815FFE'
    bondingContract = '0xC3770052334eB90De64977CE40c31D222aC14b51'
    usdcContract = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'
  }

  const Bonding = await hre.ethers.getContractAt("PozBonding", bondingContract)
  const ConversionRate = await hre.ethers.getContractAt("ConversionRate", conversionRateAddress)
  let pozToken = {};

  if (hre.network.name === "mumbai") {
    pozToken = await hre.ethers.getContractAt("PozToken", pozTokenAddress)
  }
  // else if (hre.network.name === "polygon") {
  //   pozToken = await hre.ethers.getContractAt("FastPOZ", pozTokenAddress) // should be updated later 
  // }

  // approve poz token for treasury wallet
  // const pozTokenApproveForTreasure = await pozToken.approve(
  //   bondingContract,
  //   hre.ethers.utils.parseEther("100000")
  // )
  // pozTokenApproveForTreasure.wait()
  // console.log("poz token approved for treasury wallet")

  // set conversion rate to 1USDC/10 Poz token
  const conversionTx = await ConversionRate.setRatePerToken(
    usdcContract,
    ethers.utils.parseEther("20000000000000")
  ); //set conversion rate to 1 usdc/10USDC
  conversionTx.wait()
  const rate = await ConversionRate.getRateOfToken(usdcContract)
  console.log("conversion rate for 1 USDC is ", rate / (10 ** 18), " POZ tokens") //should be 10, 1 USDC token equals to 10 poz token

  // set Lock Period to 5 mins
  const lockTx = await Bonding.setLockPeriod(60 * 5); //set initial lock period to 5 mins -- 5 mins to seconds are 60s * 5min 
  lockTx.wait()
  const lock_period = await Bonding.LOCK_PERIOD()
  console.log("lock period is", parseInt(lock_period), "seconds") //output should be 300 seconds

  // set bond token info
  const setBondTokenTx = await Bonding.setBondTokenInfo(
    usdcContract,
    hre.ethers.utils.parseEther("1000000"),
    hre.ethers.utils.parseEther("1000000")
  ) // set bond token infos -- USDC address, wallet limit and total limits
  setBondTokenTx.wait()
  let bondableTokenAddress = []
  bondableTokenAddress = await Bonding.getBondableTokens()

  console.log("Bonded token address is", bondableTokenAddress[0]) //current usdc address for bond token address

};
