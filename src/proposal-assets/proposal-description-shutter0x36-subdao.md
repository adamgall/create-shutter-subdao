## Simple Summary

Currently, ShutterDAO 0x36 utilises two platforms for governance and voting:

* **Fractal** for on-chain voting.
* **Snapshot** for off-chain voting.

This proposal aims to create a SubDAO that will hold 2.5% of the assets of the main DAO around 162k USDC and 13.25M SHU tokens (amounts subject to discussion) using the Fractal Framework. This structure will enable the main ShutterDAO to have clawback functionality over the SubDAO.

The SubDAO will integrate Kleros/reality.eth with ShutterDAO 0x36’s Snapshot space. With this arrangement, any proposal valued under $50k (amounts subject to discussion) will be passed via a Snapshot vote and executed on-chain by this SubDAO.

For context, this proposal builds on the previously [passed proposal ](https://snapshot.org/#/shutterdao0x36.eth/proposal/0xeb96472b123874877828999c3113edd254b32d033acb88ce5fc63f28b5c69510) for integrating Kleros/reality.eth in ShutterDAO. After consultations with various stakeholders, we have prioritised on-chain execution via Snapshot for the Ethereum mainnet due to recent high gas costs. A dedicated Safe with the Kleros/reality.eth module for Keyper Management on the Gnosis Chain will follow shortly.

## Process Overview

* Voting period in Snapshot: **3 days**
* Reality.eth challenge period: **3 days** (bond escalation period where Kleros arbitration can be called at any time)
* On-chain execution by the SubDAO upon completion of the challenge period

## Motivation

The aims of this proposal are twofold:

* **Gas-less Voting:** The community has noted that high gas fees hinder participation; with recent market conditions, gas prices can remain above 50 gwei for extended periods, making the cost to vote on-chain very expensive.
* **Efficient Proposal Organisation:** This SubDAO will manage proposals under $50k (amounts subject to discussion), allowing the main DAO to focus on higher value proposals. This distinction will help prioritise and streamline the governance process.

## Implementation

### SubDAO Safe Setup

* Establish a dedicated SubDAO Safe linked to the main Shutter DAO 0x36 with the Fractal framework, allowing the main DAO to clawback assets from the SubDAO at any time. This is implemented technically by attaching a Zodiac module to the SubDAO called the ‘Fractal Module’.

### Kleros/reality.eth Setup

* Install the [Gnosis Safe Snap plugin](https://docs.snapshot.org/user-guides/plugins/safesnap-reality) in the Shutter DAO 0x36 Snapshot space and link it to the SubDAO.
* Incorporate the IPFS link detailing [ShutterDAO’s specific requirements](https://docs.google.com/document/d/1UgiodCw9E0raTS4DkZMB5BTotQ0uqbFncbz9-LKMtxY/edit?usp=sharing) for securing the system.
* Deploy the Kleros SafeSnap module on the SubDAO.

## Design for the SubDAO

There will only be two entities that will have a full unilateral control of the SubDAO: The Reality.eth smart contract with the Kleros contract as arbitrator in case of dispute.

The parent DAO Shutter DAO 0x36 through the Fractal module contract.

In this setup the security will fully rely on the bond escalation game on reality.eth and on the fact that at any time (in case of an economic attack for example) anybody can ask for an arbitration with Kleros.

Kleros Cooperative, the entity responsible for the development of Kleros, will provide monitoring bots for reality.eth smart contract, the 2 ETH bond and cover all the gas fees.

## Asks for DAO and the community

General feedbacks and comments on this proposal.

Confirmation of the following parameters:

* SubDAO will hold **2.5%** of the assets of the main DAO 162k USDC and 13.25M SHU tokens (amounts subject to discussion)
* SubDAO will only deal with proposals valued **under $50k** (amounts subject to discussion)

*NB: Due to a potential conflict of interest related to this proposal which involves the use of our products, both Kleros Labs and Fractal have agreed to vote abstain. This decision will contribute to maintaining neutrality in the governance process while helping to reach the quorum.*

## Documentation and Support

### Links

* Snapshot space: [ShutterDAO0x36 on Snapshot ](https://snapshot.org/#/shutterdao0x36.eth)
* DAO Requirements: [Shutter DAO SafeSnap Policy.pdf](https://ipfs.io/ipfs/QmSSnerJD5igiCzxdQ5NvvwpWsycmtoBmzAX4VmXNRQaMZ)
* Kleros Documentation: [Kleros Dispute Resolution Integration](https://docs.kleros.io/integrations/types-of-integrations/1.-dispute-resolution-integration-plan/channel-partners/zodiac-integration)

## Voting Platform

DecentDAO (ex-Fractal)

## Transactions

Technical implementation of this proposal drafted by the Fractal team: [GitHub - adamgall/custom-fractal-proposal ](https://github.com/adamgall/custom-fractal-proposal).

## Voting Options

* Yes, implement
* No, rework the proposal
* Abstain

## Licenses:

Kleros and Fractal: MIT

Zodiac and Reality : GNU v3


