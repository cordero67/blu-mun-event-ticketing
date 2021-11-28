Solidity Pitfalls and Attacks contract security measures

-	The "onlyOwner()" modifier is used strictly for validation and solely uses require statements.
-	Having the require statements appear at the beginning of the "onlyOwner()" modifier maintians the Checks-Effects-Interactions pattern.
-	For authentication purposes, "msg.sender" is used instead of "Tx.Origin".

