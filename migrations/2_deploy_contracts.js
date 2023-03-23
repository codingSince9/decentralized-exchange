const Dex = artifacts.require("Dex");
const Dai = artifacts.require("Dai");

module.exports = async function (deployer) {
    await deployer.deploy(Dai)
    const dai = await Dai.deployed()

    await deployer.deploy(Dex, dai.address)
    const dex = await Dex.deployed()

    await dai.transfer(dex.address, '200000000000000000000000')
};