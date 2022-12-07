const hre = require("hardhat")
const { upgrades } = require("hardhat")

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  const chainId = await deployer.getChainId()
  const sushiFactoryAddress = "0xc35DADB65012eC5796536bD9864eD8773aBc74C4" // sushi factory contract address on mainnet and testnet
  let pozTokenAddress = "0x701fD77F1B00547BE745957Ddf1cc92F9D088B6B" // poz token address, mainnet address as default
  let usdcTokenAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" //USDC TOKEN address only for polygon mainnet
  let conversionRate = "0xD78B584dA0DE77A4cA59aF96F03eC17E5d305f4e" //Conversion Rate address for polygon mainnet, already deployed before
  const pozTreasuryWallet = "0xBeA8CEA056546A6F102Ca6ae1A533fB6B9068C11" // set treasuryWallet address of FastPOZ as deployer address, can change it after deployment
  const usdcTreasuryWallet = "0x842976Dc7632acfF885Ad030b0a6e7FC5b71Ff01" //usdc treasury wallet for testnet mumbai


  // for testnet mumbai
  const tempConversionRate = "0x028dAF6b0772fdd778fb951149eCDe872A9552c3"
  const tempPozToken = "0x6cb90f5595f4aE1a9Dd25f12c7701247E36B54e8"


  console.log("deploying with the account ", deployer.address)

  // if (chainId != 137) {
  //   const PozToken = await hre.ethers.getContractFactory("PozToken")
  //   const pozToken = await PozToken.deploy(hre.ethers.utils.parseEther("10000000"))
  //   await pozToken.deployed()
  //   pozTokenAddress = pozToken.address
  //   console.log("PozToken contract deployed to ", pozTokenAddress)
  // }

  // const ConversionRate = await hre.ethers.getContractFactory("ConversionRate");
  // const conversionRate = await ConversionRate.deploy()
  // await conversionRate.deployed()

  // console.log("conversionRate contract deployed to ", conversionRate.address)

  const Bonding = await hre.ethers.getContractFactory("PozBonding")
  // const bonding = await upgrades.deployProxy(Bonding, [conversionRate.address, pozTokenAddress, pozTreasuryWallet, usdcTreasuryWallet])
  const bonding = await upgrades.deployProxy(
    Bonding,
    [conversionRate, pozTokenAddress, usdcTreasuryWallet, pozTreasuryWallet],
    {
      timeout: '10000000',
      pollingInterval: '10000000'
    }
  )

  // await bonding.deployed()

  console.log("Bonding contract deployed to ", bonding.address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
