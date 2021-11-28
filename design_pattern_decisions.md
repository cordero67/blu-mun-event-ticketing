Design Patterns Employed

Access Control Design Patterns

-	"Ownable" - The Ownable design pattern is used to alter the "State" status inside the GAEventTickets contract through the following functions: setToForSale(), setToPaused(), setToPresale() and setToEnded(). Only the "creator" i.e. owner can alter the "State" status and therfore dictate whether or not tickets cna be transdered.

Inheritance and Interfaces

-	"Interface" - The ERC20Interface is used in the construction of "GAEventTickets.sol"
