# Custom Fractal Proposal

This codebase implements a script which crafts and submits a custom proposal to a Fractal DAO.

## Installation

1. Use correct Node version: `nvm use`
2. Install packages: `npm install`
3. Set up config: `cp .env.example .env` (then edit appropriately)

## Usage

IMPORTANT! Configure your environment using the `.env` file before running the script.

Run the script with `npx ts-node src`

## Intention

This script will create and post a proposal to a Fractal DAO. The proposal includes three transactions.

1. Add a text record to the DAO's ENS name, with a key of `daorequirements` and a value of `ipfs://[hash]`.
2. Create a new child DAO, which has multisig signers, as well as the Fractal Module (to enable the parent to clawback funds if necessary), as well as Kleros's reality.eth module (to enable Snapshot voting consensus and human-based governance arbitration).
3. Transfer assets from the parent DAO to the new child DAO.
