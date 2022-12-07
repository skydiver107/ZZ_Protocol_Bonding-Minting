const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("Test bond using conversion rate for market price", function () {
  let pozToken, usdtToken, admin, usdc_treasure, poz_treasure, accounts, mockBonding, conversionRate

  before(async function () {
    accounts = await ethers.getSigners()
    admin = accounts[0]
    usdc_treasure = accounts[1]
    poz_treasure = accounts[2]
  })

  beforeEach(async function () {
    const PozToken = await ethers.getContractFactory("PozToken")
    pozToken = await PozToken.deploy(ethers.utils.parseEther("10000000"))
    await pozToken.deployed()
    const UsdtToken = await ethers.getContractFactory("PozToken")
    usdtToken = await UsdtToken.deploy(ethers.utils.parseEther("1000000"))
    await usdtToken.deployed()
    const ConversionRate = await ethers.getContractFactory("ConversionRate")
    conversionRate = await ConversionRate.deploy()
    await conversionRate.deployed()
    const MockBonding = await ethers.getContractFactory("MockBonding")
    mockBonding = await MockBonding.deploy(conversionRate.address, pozToken.address, usdc_treasure.address, poz_treasure.address)
    await mockBonding.deployed()
    await mockBonding.setBondTokenInfo(
      usdtToken.address,
      ethers.utils.parseEther("100000"),
      ethers.utils.parseEther("10000")
    )
    await pozToken.transfer(poz_treasure.address, ethers.utils.parseEther("1000000"))
    await pozToken.connect(poz_treasure).approve(
      mockBonding.address,
      ethers.utils.parseEther("1000000")
    )
  })

  it("Set Conversion Rate as 1 usdt", async function () {
    await conversionRate.setRatePerToken(usdtToken.address, ethers.utils.parseEther("1"));
    const rate = await conversionRate.getRateOfToken(usdtToken.address)
    expect(rate).to.be.equal(ethers.utils.parseEther("1"))
  })

  it("Set and get bonding token info", async function () {
    await mockBonding.setBondTokenInfo(
      usdtToken.address,
      ethers.utils.parseEther("100000"),
      ethers.utils.parseEther("10000")
    )
    expect((await mockBonding.getBondableTokens())[0]).to.be.equal(usdtToken.address)
    const info = await mockBonding.getBondingTokenInfo(usdtToken.address)
    expect(info.totalLimit).to.be.equal(ethers.utils.parseEther("100000"))
    expect(info.walletLimit).to.be.equal(ethers.utils.parseEther("10000"))
  })

  it("Should not be able to bond for non listed tokens", async function () {
    const temp = "0x225465Aa3592C53e0597eDa0F5364ab0E014C940"
    await expect(mockBonding.purchasePOZ(temp, ethers.utils.parseEther("20000"))).to.be.revertedWith("PozBonding: not in bonding list.");
  })

  it("Bond usdt with limit check", async function () {
    await usdtToken.approve(mockBonding.address, ethers.utils.parseEther("1000000"))
    await expect(mockBonding.purchasePOZ(usdtToken.address,
      ethers.utils.parseEther("200000"))).to.be.revertedWith("PozBonding: total limit exceeds balance.")
    await expect(mockBonding.purchasePOZ(usdtToken.address,
      ethers.utils.parseEther("20000"))).to.be.revertedWith("PozBonding: bond limit per wallet exceeds balance.")
  })

  it("Get value of bonding length after bonding", async function () {
    await usdtToken.connect(admin).transfer(accounts[3].address, ethers.utils.parseEther("1"))
    await usdtToken.connect(accounts[3]).approve(mockBonding.address, ethers.utils.parseEther("1"))
    await conversionRate.setRatePerToken(usdtToken.address, ethers.utils.parseEther("1"))
    await mockBonding.connect(accounts[3]).purchasePOZ(usdtToken.address, ethers.utils.parseEther("1"))
    const bondingLength = await mockBonding.getBondingLength(accounts[3].address, usdtToken.address)
    expect(bondingLength).to.be.equal(1)
  })

  it("set lock period to 30 minutes", async function () {
    await mockBonding.setLockPeriod(60 * 30 * 1000);
    expect(await mockBonding.LOCK_PERIOD()).to.be.equal(1800000);
  })

  it("Should get 1 poz as claimable amount after bond 1 usdt and 14 days left", async function () {
    const date = new Date()
    await usdtToken.connect(admin).transfer(accounts[3].address, ethers.utils.parseEther("1"))
    await usdtToken.connect(accounts[3]).approve(mockBonding.address, ethers.utils.parseEther("1"))
    await conversionRate.setRatePerToken(usdtToken.address, ethers.utils.parseEther("1"))
    await mockBonding.connect(accounts[3]).purchasePOZ(usdtToken.address, ethers.utils.parseEther("1"))
    expect((await mockBonding.getClaimablePoz(accounts[3].address, usdtToken.address))[0]).to.be.equal(
      "0")
    expect(await usdtToken.balanceOf(accounts[1].address)).to.be.equal(ethers.utils.parseEther("1"))

    const bondInfo = await mockBonding.bondInfo(accounts[3].address, usdtToken.address, 0)
    await mockBonding.setCurrentTime(parseInt(date.getTime() / 1000) + 86400 * 14)
    const balance = await mockBonding.getClaimablePoz(accounts[3].address, usdtToken.address)
    expect((await mockBonding.getClaimablePoz(accounts[3].address, usdtToken.address))[0]).to.be.equal(ethers.utils.parseEther("1"))
    expect(balance[0]).to.be.equal(ethers.utils.parseEther("1"))
    expect(balance[1]).to.be.equal(1)

    // const usdtBalance = await usdtToken.balanceOf(accounts[1].address)
    // console.log("usdtbalance on treasury is", usdtBalance)
    // await mockBonding.setConversionContract(conversionRate.address)
    // console.log("conversion", await mockBonding.conversion())
    // console.log("bondinfo is", bondInfo)
    // console.log("balance", parseInt(balance[0]))
    // console.log("index is", parseInt(balance[1]))
  })

  it("Balance of USDC Treasure wallet should be 1 after purchasing 1 POZ token", async function () {
    await usdtToken.connect(admin).transfer(accounts[3].address, ethers.utils.parseEther("1"))
    await usdtToken.connect(accounts[3]).approve(mockBonding.address, ethers.utils.parseEther("1"))
    await conversionRate.setRatePerToken(usdtToken.address, ethers.utils.parseEther("1"))
    await mockBonding.connect(accounts[3]).purchasePOZ(usdtToken.address, ethers.utils.parseEther("1"))
    expect(await usdtToken.balanceOf(accounts[1].address)).to.be.equal(ethers.utils.parseEther("1")) //check balance of usdc treasury wallet
  })


  it("Should claim 1 poz after bond 1 usdt and 14 days left", async function () {
    const date = new Date()
    await usdtToken.connect(admin).transfer(accounts[3].address, ethers.utils.parseEther("1"))
    await usdtToken.connect(accounts[3]).approve(mockBonding.address, ethers.utils.parseEther("1"))
    await conversionRate.setRatePerToken(usdtToken.address, ethers.utils.parseEther("1"))
    await mockBonding.connect(accounts[3]).purchasePOZ(usdtToken.address, ethers.utils.parseEther("1"))
    expect(await pozToken.balanceOf(accounts[3].address)).to.be.equal("0")
    await mockBonding.setCurrentTime(parseInt(date.getTime() / 1000) + 86400 * 14)
    await mockBonding.connect(accounts[3]).claimPOZ(usdtToken.address)
    expect(await pozToken.balanceOf(accounts[3].address)).to.be.equal(ethers.utils.parseEther("1"))
    expect(await usdtToken.balanceOf(accounts[1].address)).to.be.equal(ethers.utils.parseEther("1"))
  })
})

