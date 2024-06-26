# Custom Fractal Proposal

This codebase implements a script which crafts and submits a custom proposal to a Decent Safe.

## Installation

1. Use correct Node version: `nvm use`
2. Install packages: `npm install`
3. Set up config: `cp .env.example .env`
   1. Edit your `.env` appropriately
   2. Create a file for the proposal's description (markdown supported) at `src/proposal-assets/proposal-description.md` (or wherever you specify in the `.env`'s `PROPOSAL_DESCRIPTION_FILE` parameter)

## Usage

IMPORTANT! Configure your environment using the `.env` file before running the script.

Run the script with `npx ts-node src`

## Intention

This script will create the data necessary to submit a new proposal to a Decent Safe. The proposal data includes a few transactions which do the following things:

- Adds a text record to the parent Safe's ENS name, with a key of `daorequirements` and a value of `ipfs://[hash]`.
- Deploys and configures a new instance of the `FractalModule`, which enables parent Safes to clawback funds from child Safes.
- Deploys and configures a new instance of the `RealityModuleETH`, which enables Snapshot voting consensus and human-based governance arbitration.
- Deploys a new child Safe, which has multisig signers.
- Enables the new Safe modules on this newly deployed child Safe.
- Creates the on-chain relationship between the Parent and Child Safes, for visual representation in Fractal's UI.
- Transfers assets from the parent DAO to the new child Safe.

## Testing

First and foremost, study the `.env.example` and make sure you understand what each variable is for.

Then, create a Decent Safe on Sepolia and prepare it for testing:

- It needs "ERC20 Token Voting" governance.
- You should make sure to delegate your voting tokens to yourself, so you can vote on the submitted proposal.
- Transfer a "Name wrapped" ENS record to this testing Decent Safe.
  - The proposal will be setting a text record on this ENS name.
- Transfer some ERC20 assets to the testing Decent Safe.
  - The proposal will be transferring some of these assets to the new child Safe.

Finally, create an `.env` file, copy the contents from `.env.example` into it, and adjust all of the variables appropriately as per how you set up your testing Fractal Safe.

## Shutter DAO 0x36

This script was ran, and the resulting proposal data was submitted to Shutter DAO 0x36:
https://app.decentdao.org/proposals/21?dao=eth:0x36bD3044ab68f600f6d3e081056F34f2a58432c4

The transaction which created this proposal:
https://etherscan.io/tx/0xd2830cb930c555114fccb4ce1d4811476acc910e4c0528d23137d11d2d8ef184

To run this script again and receive the same output as the data in the proposal transaction, run:

```sh
npm run repeat:shutter
```

Compare the results (everything after `!!! PROPOSAL ARGUMENTS !!!`) with the decoded input data in the transaction on Etherscan, they should match.
