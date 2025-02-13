const { ethers, run } = require("hardhat");

const main = async () => {
  const network = await ethers.provider.getNetwork();
  console.log(`Deploying to ${network.name} (${network.chainId})`);

  console.log("Deploying HoneypotDetector...");
  const HoneypotDetector = await ethers.getContractFactory("HoneypotDetector");
  const detector = await HoneypotDetector.deploy();
  
  // Wait for deployment transaction to be mined
  await detector.deploymentTransaction().wait(5); // Wait for 5 block confirmations

  const address = await detector.getAddress();
  console.log(`HoneypotDetector deployed to: ${address}`);

  console.log("Verifying contract...");
  try {
    // Add a small delay before verification
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds

    await run("verify:verify", {
      address: address,
      constructorArguments: []
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 