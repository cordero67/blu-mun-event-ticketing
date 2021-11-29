Solidity Pitfalls and Attacks contract security measures

-	The "onlyOwner()" modifier is used strictly for validation and solely uses require statements.
-	Require statements appear at the beginning of "onlyOwner()" modifier maintaining Checks-Effects-Interactions pattern.
-	For authentication purposes, "msg.sender" is used instead of "Tx.Origin".

