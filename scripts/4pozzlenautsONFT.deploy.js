const hre = require("hardhat")
const { upgrades } = require("hardhat")

async function main() {
  let onft;
  const [deployer] = await hre.ethers.getSigners()
  const chainId = await deployer.getChainId()

  // for testnet mumbai
  const tempPozTokenAddress = "0x6cb90f5595f4aE1a9Dd25f12c7701247E36B54e8"
  const tempUSDCTokenAddress = "0xc44556Cc482126b5c4C4093de521F8C13302FBa3"
  const tempTreasuryWalletAddress = "0x3012A6Ed9c522528BaDc0eaB8294A0E62E65f849"

  const ONFT = await hre.ethers.getContractFactory("PozzlenautsONFTPoz"); //for Polygon mainnet and Mumbai testnet

  onft = await ONFT.deploy(
    "https://ipfs.io/ipfs/QmaUhcwr1sYR8cRaKb831vSXHnK2q23xR8GH3MXzD54t99/",
    "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8", //layer zero address for mumbai
    0,
    1221,
    tempUSDCTokenAddress,
    tempPozTokenAddress,
    tempTreasuryWalletAddress
  );
  await onft.deployed();

  console.log("deploying with the account ", deployer.address)
  console.log("Pozzlenauts contract deployed with the address", onft.address)

}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})