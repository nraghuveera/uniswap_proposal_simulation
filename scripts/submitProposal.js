const ethers = require("ethers");
const {
  GOVERNOR_BRAVO_ABI,
  ENS_PUBLIC_RESOLVER_ABI,
} = require("./utils");
const { namehash } = require("@ethersproject/hash");
const { Interface } = require("@ethersproject/abi");
require("dotenv").config();
const { callbackify } = require("util");

// required to make truffle dashboard work
// module.exports = callbackify(async () => {
//   await main();
// });

async function main() {
  const governorBravoAddress = "0x408ED6354d4973f66138C91495F2f2FCbd8724C3";
  const governorBravo = new ethers.Contract(
    governorBravoAddress,
    GOVERNOR_BRAVO_ABI
  );

  const NODE = namehash("v3-core-license-grants.uniswap.eth");
  const KEY = "Celo Uni v3 Additional Use Grant";
  const VALUE = `The Celo Foundation and cLabs (Celo) may use the Licensed Work to deploy it on Celo, an EVM compatible blockchain, provided that the deployment is subject to Ethereum layer 1 Uniswap Protocol governance and control. Celo is permitted to use subcontractors to do this work. This license is conditional on Celo complying with the terms of the Business Source License 1.1, made available at https://github.com/Uniswap/v3-core/blob/main/LICENSE.`;

  const ensPublicResolverInterface = new Interface(ENS_PUBLIC_RESOLVER_ABI);
  const setTextCalldata = ensPublicResolverInterface.encodeFunctionData(
    "setText",
    [NODE, KEY, VALUE]
  );

  const PUBLIC_ENS_RESOLVER_ADDRESS =
    "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41";

  const targets = [PUBLIC_ENS_RESOLVER_ADDRESS];
  const values = [0];
  const sigs = [""];
  const calldatas = [setTextCalldata];
  const description = "Celo Additional Use Grant";
  // const michiganAddress = "0x13BDaE8c5F0fC40231F0E6A4ad70196F59138548";

  // truffle dashboard (browser signer)
  const provider = new ethers.providers.JsonRpcProvider(
    "http://localhost:24012/rpc"
  );
  const signer = provider.getSigner();

  // use with private key in .env
  // const provider = new ethers.providers.AlchemyProvider(null, process.env.ALCHEMY_KEY)
  // const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  // make the proposal
  await governorBravo
    .connect(signer)
    .propose(targets, values, sigs, calldatas, description);
}

// uncomment and use process.env.PRIVATE_KEY when not using truffle dashboard 
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
