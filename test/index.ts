import { expect } from "chai";
import { ethers, network } from "hardhat";
import { waffle } from "hardhat";
import { BigNumber, Contract, Wallet } from "ethers";
import {
  GOVERNOR_BRAVO_ABI,
  TIMELOCK_ABI,
  ENS_REGISTRY_ABI,
  ENS_PUBLIC_RESOLVER_ABI,
  UNI_ABI,
} from "./utils";
import { namehash } from "@ethersproject/hash";
import { keccak256 } from "@ethersproject/keccak256";
import { utils } from "ethers";
import { Interface } from "@ethersproject/abi";
import "hardhat";

const { provider } = waffle;

describe("Celo / Uniswap additional use grant simulation", async () => {
  let wallet: Wallet, other: Wallet;

  async function advanceBlockHeight(blocks: number) {
    const txns = [];
    for (let i = 0; i < blocks; i++) {
      txns.push(network.provider.send("evm_mine"));
    }
    await Promise.all(txns);
  }

  it("proposal simulation", async () => {
    // get the governor bravo contract
    const governorBravoAddress = "0x408ED6354d4973f66138C91495F2f2FCbd8724C3";
    const governorBravo = new Contract(
      governorBravoAddress,
      GOVERNOR_BRAVO_ABI,
      provider
    );

    // get the timelock contract
    const timelockAddress = "0x1a9C8182C09F50C8318d769245beA52c32BE35BC";
    const timeLock = new Contract(timelockAddress, TIMELOCK_ABI, provider);

    // get signers
    [wallet, other] = await (ethers as any).getSigners();

    // check the timelock from the governor matches the timelock address
    const timelockAddressFromGovernor = await governorBravo.timelock();

    console.log('timeLockAddressFromGovernor', timelockAddressFromGovernor);
    expect(timelockAddressFromGovernor).to.eq(timeLock.address);

    // wallet submits a proposal

    // const NODE_TOP_LEVEL: string = namehash("uniswap.eth");
    // const LABEL: string = keccak256(
    //   utils.toUtf8Bytes("v3-core-license-grants")
    // );
    // const OWNER_UNISWAP_GOVERNANCE_TIMELOCK: string =
    //   "0x1a9C8182C09F50C8318d769245beA52c32BE35BC";
    // const RESOLVER_PUBLIC_ENS_RESOLVER: string =
    //   "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41";
    const TTL: number = 0;

    const NODE: string = namehash("v3-core-license-grants.uniswap.eth");
    const KEY: string = "Celo Uni v3 Additional Use Grant";
    const VALUE = `The Celo Foundation and cLabs (“Celo”) are granted an additional use grant to use the Uniswap V3 Core software code (which is made available to Celo subject to license available at https://github.com/Uniswap/v3-core/blob/main/LICENSE (the “Uniswap Code”)). As part of this additional use grant, Celo receives license to use the Uniswap Code for the purposes of a full deployment of the Uniswap Protocol v3 onto the Celo blockchain. Celo is permitted to use subcontractors to do this work.  This license is conditional on Celo complying with the terms of the Business Source License 1.1, made available at https://github.com/Uniswap/v3-core/blob/main/LICENSE.`;

    // const ensRegistryInterface = new Interface(ENS_REGISTRY_ABI);
    // const setSubnodeRecordCalldata = ensRegistryInterface.encodeFunctionData(
    //   "setSubnodeRecord",
    //   [
    //     NODE_TOP_LEVEL,
    //     LABEL,
    //     OWNER_UNISWAP_GOVERNANCE_TIMELOCK,
    //     RESOLVER_PUBLIC_ENS_RESOLVER,
    //     TTL,
    //   ]
    // );

    const ensPublicResolverInterface = new Interface(ENS_PUBLIC_RESOLVER_ABI);
    const setTextCalldata = ensPublicResolverInterface.encodeFunctionData(
      "setText",
      [NODE, KEY, VALUE]
    );

    const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
    const PUBLIC_ENS_RESOLVER_ADDRESS: string =
      "0x4976fb03c32e5b8cfe2b6ccb31c09ba78ebaba41";

    const targets = [PUBLIC_ENS_RESOLVER_ADDRESS];
    const values = [0];
    const sigs = [""];
    const calldatas = [setTextCalldata];
    const description = "Celo Additional Use Grant";

    const ensPublicResolver = new Contract(
      PUBLIC_ENS_RESOLVER_ADDRESS,
      ENS_PUBLIC_RESOLVER_ABI,
      provider
    );
    let licenseText = await ensPublicResolver.text(NODE, KEY);

    const ensRegistry = new Contract(
      ENS_REGISTRY_ADDRESS,
      ENS_REGISTRY_ABI,
      provider
    );
    let subnodeResolver = await ensRegistry.resolver(NODE);
    let subnodeRecordExists = await ensRegistry.recordExists(NODE);
    console.log("subnodeResolver", subnodeResolver);
    expect(subnodeResolver).to.eq("0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41");
    expect(licenseText).to.eq("");
    expect(subnodeRecordExists).to.eq(true);

    const michiganAddress = "0x13BDaE8c5F0fC40231F0E6A4ad70196F59138548";
    // delegate votes from whales to the wallet
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [michiganAddress], // michigan
    });

    const michiganSigner = await ethers.getSigner(michiganAddress);

    // get the Uni contract
    const uniAddress = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
    const uni = new Contract(uniAddress, UNI_ABI, provider);

    let blockNumber = (await provider.getBlock("latest")).number;
    console.log("blockNumber OLD", blockNumber);

    // check the prior votes of michigan
    let priorVotesMichigan = await uni.getPriorVotes(
      michiganAddress,
      blockNumber - 1
    );
    console.log("priorVotesMichigan", priorVotesMichigan);

    // transfer ether to michigan to execute the delegation transaction
    await wallet.sendTransaction({
      to: michiganAddress,
      value: ethers.utils.parseEther("1"),
    });

    let currentProposalCount = await governorBravo.proposalCount(); // expect 10
    console.log("currentProposalCount", currentProposalCount);
    expect(currentProposalCount).to.eq(14);

    // make the proposal
    await governorBravo
      .connect(michiganSigner)
      .propose(targets, values, sigs, calldatas, description);

    currentProposalCount = await governorBravo.proposalCount();
    expect(currentProposalCount).to.eq(15);
    console.log("current number of proposals created: " + currentProposalCount);
    let proposalInfo = await governorBravo.proposals(15);
    console.log(proposalInfo);

    await advanceBlockHeight(13141); // fast forward through review period

    const uniWhaleAddresses = [
      "0x2b1ad6184a6b0fac06bd225ed37c2abc04415ff4",
      "0xe02457a1459b6c49469bf658d4fe345c636326bf",
      "0x8e4ed221fa034245f14205f781e0b13c5bd6a42e",
      "0x61c8d4e4be6477bb49791540ff297ef30eaa01c2",
      "0xa2bf1b0a7e079767b4701b5a1d9d5700eb42d1d1",
      "0xe7925d190aea9279400cd9a005e33ceb9389cc2b",
      "0x7e4a8391c728fed9069b2962699ab416628b19fa",
    ];

    // start casting votes
    for (let i = 0; i < uniWhaleAddresses.length; i++) {
      const whaleAddress = uniWhaleAddresses[i];

      await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [whaleAddress], // michigan
      });

      const whaleSigner = await ethers.getSigner(whaleAddress);

      // send ether to the whale address

      await wallet.sendTransaction({
        to: whaleAddress,
        value: ethers.utils.parseEther("1"),
      });

      await governorBravo.connect(whaleSigner).castVote(15, 1);
    }

    await advanceBlockHeight(40320); // fast forward through voting period

    await governorBravo.connect(michiganSigner).queue(15);

    proposalInfo = await governorBravo.proposals(15);

    console.log(proposalInfo);

    await network.provider.request({
      method: "evm_increaseTime",
      params: [172800],
    });

    await advanceBlockHeight(1); //after changing the time mine one block

    await governorBravo.connect(michiganSigner).execute(15);

    proposalInfo = await governorBravo.proposals(15);

    console.log(proposalInfo); //expect "executed"

    // check ens records are correctly updated
    licenseText = await ensPublicResolver.text(NODE, KEY);
    console.log(licenseText);
    expect(licenseText).to.eq(VALUE);

    // check subrecord data
    subnodeResolver = await ensRegistry.resolver(NODE);
    console.log("subnodeResolver", subnodeResolver);

    expect(subnodeResolver.toLowerCase()).to.eq(
      PUBLIC_ENS_RESOLVER_ADDRESS.toLowerCase()
    );

    let ttlOfSubnode = await ensRegistry.ttl(NODE);

    expect(ttlOfSubnode).to.eq(TTL);

    subnodeRecordExists = await ensRegistry.recordExists(NODE);
    expect(subnodeRecordExists).to.eq(true);
  });
});
