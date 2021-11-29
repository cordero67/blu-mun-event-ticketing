# Blü Mün Event Ticketing DApp

## Project Overview

Blü Mün Event Ticketing is a blockchain based ticketing solution that allows event creators to issue tickets to an event and subsequently maintain complete control over its entire journey, i.e. both the primary and secondary markets.

The Blü Mün Event Ticketing DApp will be released in several phases (see section Blü Mün Event Ticketing DApp Construction for description of all phases).

Phase 1 of the DApp has been completed as is intended for submission as the final project for the 2021 Consensys Blockchain Developer Bootcamp. Phase 1 consists of four different user screens.

•	Issue general admission tickets

•	Purchase general admission tickets from event creator

•	Generate a list of events created by a given event creator

•	Generate a ticket wallet for a given ticket buyer

The Blü Mün Event Ticketing DApp can be accessed at


## Directory Structure

Key folders/files of the project are located in the project’s root directory:

### > Consensys Project Documents

    Contains description files for the 2021 Consensys Blockchain Developer Bootcamp project submission:

#####        avoiding_common_attacks.md

        deployed_address.txt

        design_pattern_decisions.md

### > migrations

    Contains truffle migration scripts.

> src

    Contains files that support and generate the front-end interface:

        > abis

            Houses the abis for each smart contract the was compiled and migrated.

        > components

            Houses all files necessary to support the user interface and specifically the App.js file which contains a majority of the working code.

        > contracts

            Houses the all smart contract files written in Solidity.

    > test

        Contains the EventTicketFactory.test.js file which includes 18 different tests of the EventTicketingFactory and GAEventTickets smart contracts.

package-lock.json

    Contains package-lock. json a list of all modifications (subsequent installs) the npm made to the node_modules tree, or package. json.

package.json

    Contains a list of all dependencies.

README.md

    Contains a description of the project.

truffle-config.js

    Contains the truffle-config.js file that houses information allowing truffle to compile, migrate and test the project and its deployment.

## DApp Compilation, Migration and Testing

This project was compiled, migrated and tested using Truffle.

To recreate, perform the following:

•	Open up a local copy of Ganache-GUI

•	In a terminal window, type “truffle test”

This performs the following:

Compiles all .sol files identified by a migrations script (migrations folder of project root directory: ”src.migrations”). This will also generate a “.json” file for each compiled contract that contains the associated contract’s abi and places them in the “src.abis” folder.

Migrates all .sol files to the designated blockchain and augments “networks” field inside each “.json” files generated during the preceding compilation step.

Executes the “EventTicketFactory.js” file which contains all the associated tests of both the “GAEventTickets" and "EventTicketingFactory" smart contracts.
Tests are set to run on port 7545. To compile, migrate and test using port 8545 (i.e. ganache-cli), perform the following:

•	Comment out line 24 and uncomment line 25 in the truffle-config.js file.

•	In a terminal window, type “ganache-cli”

•	In a terminal window, type “truffle test”


## User Interaction


## Blü Mün Event Ticketing DApp

Upon completion of all outlined phases, the Blü Mün Event Ticketing DApp will allow event creators to:

•	Issue crypto tickets to events and post these events online

•	Sell tickets and instantly receive the associated revenues

•	Modify the parameters associated with initial ticket, e.g. price and quantity

•	Control the tickets’ secondary market sales, e.g. maximum resale price, profit sharing

•	Issue instant refunds to ticket holders

•	Maintain complete knowledge of each ticket sold, e.g. current ticket buyer, sales price

Ticket buyers would benefit from the following:

•	Eliminate the risk of buying a fraudulent ticket(s)

•	Potential to not pay exorbitant ticket prices on secondary ticket sales

•	Transfer tickets to friends zero cost


## Current and projected future state of US Event Ticketing Sales

At the start of 2021 the market size, as measured by revenue, of the US Event Ticket Sales (“US ETS”) industry was $6.3bn with an annualized projected growth rate of 14.7%. Even though the industry has been hurt by the recent pandemic, its long-term market size is estimated to increase even when adjusted for inflation. However, while future annual projected growth rates are expected to remain positive, it is doubtful that the 2021 projected growth rate will be maintained as a good portion of the 2021 figure is a result of the US population’s pent-up demand for live activities that were significantly limited due to the pandemic.

Much of the industry’s long-term market size and growth will be influenced by the economy and the changing demographic in the US. The amount of disposable income that a consumer has determines their ability to spend money on event tickets. People are more likely to purchase concert, sporting event or theater admissions as incomes increase, while sales to events decrease during periods of falling income. Per capita disposable income is expected to increase in 2021, representing a potential opportunity for the industry.

Additionally, the evolution of spending patterns for key demographic groups in the US also bode well for the industry. In general, younger age groups in the US, 20 – 40 years, are spending more of their disposable income on live experience related items rather the physical goods, as compared to the same age group in decades past.

Currently, the 25-29 and 30-35 age groups in the US represent the two largest in the US. As the natural level of disposable incomes of individuals in these age groups grow through their lifetime, independent of economic events, the amount spent on live events is expected to increase. Furthermore, should the trend of spending more disposable on live experience related items continue, the very long-term strength of the industry remains positive.


## Problems with Event Ticketing

The biggest problem with event ticketing is the secondary market, where tickets purchased on the primary market are resold at any price by middle-men such as touts, scalpers and would-be attendees. Secondary markets are where the bulk of industry fraud arises, since these markets are unregulated and are ridden with counterfeits, tickets that have been already used or sold, or tickets that have been bulk-bought in primary markets and re-listed at sky-high prices in secondary markets. It should be noted that event organizers currently have no control or right to revenue in the secondary markets, and that these secondary markets extend through to black markets at the door of events where middle-men re-sell printed tickets to hopeful attendees. On top of this, secondary market platforms can charge the buyer up to a 10% fee on ticket purchases. In aggregate, the final ticket purchaser can end up paying a final price that is multiple times its original price, with the difference being completely absorbed by middle-men and secondary market ticketing platforms.


## The Blockchain Solution

It is believed that blockchain technology can help mitigate some of these problems by offering on-chain ticketing sales that extends through the entire life of a ticket’s journey; from the primary to the secondary markets, through to the final attendance of the associated event.

Through blockchain issuance, event creators would have the ability to offer tickets to events, (i.e., primary market sales), and control any subsequent resale(s) (i.e. secondary market sales). This type of issuance would allow the event creator to provide parameters for ticket resales such as whether or not a ticket can be resold or for what maximum price. It would also allow event creators to dictate what portion of any price mark-up would be kept by the reseller.

Additionally, the immutability of the blockchain would help protect would be buyers from purchasing fraudulent tickets.

Moreover, blockchain issuance can allow event creators to receive revenues from ticket sales instantly unlike most current online ticket sellers. This proves most beneficial should the event creator either need such revenues to help pay for the event or need to provide an instance refund should the event be cancelled. This situation was prominent during the recent pandemic where ticketing platforms that hold ticket revenues until the completion of event, where not able to refund ticket holders, leaving event creators unable to correct the situation.


## Blü Mün Event Ticketing DApp Construction

Blü Mün Event Ticketing DApp will be released in several phases:

Phase 1: General admission tickets primary market issuance (ERC-20 contracts)

•	Issue general admission tickets

•	Purchase general admission tickets from event creator

•	Generate a list of events created by event creator

•	Generate a ticket wallet for a given ticket buyer

Phase 2: Event creator maintenance of general admission ticket offerings

•	Ability to change parameters of ticket offering, e.g. ticket price, tickets available

•	Modify the state of primary ticket sales, e.g. for sale, paused, completed

•	Refund ticket buyer(s)

Phase 3: Secondary market for general admission tickets

•	Modify issuance of general admission tickets to include secondary market parameters

•	Create a secondary market where general admission tickets can be bought and sold

Phase 4: Assigned seating tickets primary market issuance (ERC-721 and ER-1155 contracts)

•	Issue assigned seating tickets

•	Purchase assigned seating tickets from event creator

•	Include assigned seating issuances to list of events created by event creator

•	Include assigned seating tickets to buyers’ ticket wallets

Phase 5: Event creator maintenance of assigned seating ticket offerings

•	Update event creator maintenance to include assigned seating issuances

Phase 6: Secondary market for assigned seating tickets

•	Modify issuance of assigned seating tickets to include secondary market parameters

•	Include assigned seating issuances to secondary market
