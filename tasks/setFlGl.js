module.exports = async function (taskArgs, hre) {
  var pozzlenautsONFT;
  const rootType = taskArgs.roottype;
  const flroot =
    "0xf865820a58004bfe9b00769448f31fcc51eacf2e7df519e623b334634ec4e67a";
  const glroot =
    "0xff1809e4be9d2ee04b0338bbe79c1a29200871d6b008dddfde2e6badb9384c58";
  if (hre.network.name === "polygon" || hre.network.name === "mumbai")
    pozzlenautsONFT = await ethers.getContract("PozzlenautsONFTPoz");
  else pozzlenautsONFT = await ethers.getContract("PozzlenautsONFT");

  console.log(`[source] PozzlenautsONFT.address: ${pozzlenautsONFT.address}`);
  console.log(`FlRoot: ${flroot}`);
  console.log(`GLRoot: ${glroot}`);
  if (rootType == "FL") {
    try {
      let tx = await (await pozzlenautsONFT.setFLMerkleRoot(flroot)).wait();
      console.log(`✅ [${hre.network.name}] setFLMerkelRoot to: (${flroot})`);
      console.log(` tx: ${tx.transactionHash}`);
    } catch (e) {
      console.log(e);
    }
  }
  if (rootType == "GL") {
    try {
      let tx = await (await pozzlenautsONFT.setGLMerkleRoot(glroot)).wait();
      console.log(`✅ [${hre.network.name}] setGLMerkleRoot to: (${glroot})`);
      console.log(` tx: ${tx.transactionHash}`);
    } catch (e) {
      console.log(e);
    }
  }
};
