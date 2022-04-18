# Uniswap Additional Use Grant for Celo Proposal Simulation

This repository runs a simulation of the Celo's proposal to Uniswap Governance to request the Additional Use Grant. More details on how the grant is practically provided can be found in here https://github.com/Uniswap/deploy-v3 (under the Licensing section). The simulation is executed by running a test scenario in https://github.com/Voltz-Protocol/uniswap_proposal_simulation/blob/main/test/index.ts. 
## Run the simulation

In order to run the simulation the following steps need to be taken:

### Setup
```
git clone https://github.com/Voltz-Protocol/uniswap_proposal_simulation.git
cd uniswap_proposal_simulation
npm install
```

Additionally, since the simulation is done on top of the Ethereum Mainnet fork, we need to connect with the Alchemy api to get access to their archive node. This is done by updating the network url in https://github.com/Voltz-Protocol/uniswap_proposal_simulation/blob/main/hardhat.config.ts to the one provided by Alchemy.

### Run the Simulation
```
npx hardhat test
```

## Run the proposal script

The script runs the transaction script in conjunction with [truffle dashboard](https://trufflesuite.com/docs/truffle/getting-started/using-the-truffle-dashboard/) so you don't have to copy and paste senstive account info (private keys).

1. Start truffle dashboard. Make sure truffle is install and run `$ truffle dashboard` to start it. This will open a web browser page where you can approve transactions with metamask.

2. Run the script.

```shell
npx hardhat run scripts/submitProposal.js --network truffle-dashboard
```