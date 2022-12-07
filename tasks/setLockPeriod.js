module.exports = async function (taskArgs, hre) {
  let pozTokenAddress;
  let conversionRateAddress;
  let treasuryWallet;
  let bondingContract;

  if (hre.network.name === "mumbai") {
    pozTokenAddress = "0x343e0b2A9ff77D84cC9919977a5Cb356776350CB"
    conversionRateAddress = '0x8DA22585611c92f797582734951FCa27DDFEF3CC'
    treasuryWallet = '0x41B002E9D253A062acE0c698cd3F936B0c815FFE'
    bondingContract = '0xF8120Fab6A7f7a72A9eae245F87dFa59a9A449b6'
  } else if (hre.network.name === "polygon") {
    pozTokenAddress = '0x701fD77F1B00547BE745957Ddf1cc92F9D088B6B'
    conversionRateAddress = '0x540753b6b1Eca897A887949F1129F972b9731F32'
    treasuryWallet = '0x41B002E9D253A062acE0c698cd3F936B0c815FFE'
    bondingContract = '0x22898207DadE6ab8e7E591ec88fe4A10ad570f97'
  }

  const Bonding = await hre.ethers.getContractAt("PozBonding", bondingContract)

  const lockTx = await Bonding.setLockPeriod(60 * 5); //set initial lock period to 5 mins -- 5 mins to seconds are 60s * 5min 
  lockTx.wait()
  const lock_period = await Bonding.LOCK_PERIOD()
  console.log("lock period is", parseInt(lock_period), "seconds") //output should be 300 seconds

};
