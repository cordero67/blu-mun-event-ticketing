// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// imports the Token contract not a specific token
import "./Token.sol";

// TODO:
// [X] Set the fee account
// [X] Deposit Ether
// [ ] Withdraw Ether
// [X] Deposit tokens
// [ ] Withdraw tokens
// [ ] Check balances
// [ ] Make order
// [ ] Cancel order
// [ ] Fill order
// [ ] Charge fees

contract Exchange {
    using SafeMath for uint256;

    address payable public feeAccount;
    uint256 public feePercent;
    address constant ETHER = address(0); // address that represents Ether deposits

    // first address is the token address
    // second address is the address of the token holder who made deposit
    mapping(address => mapping(address => uint256)) public tokens;

    event Deposit(address indexed token, address indexed user, uint256 amount, uint256 balance);

    constructor(address payable _feeAccount, uint _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // receives ether sent to this contract
    function depositEther() public payable {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    // receives address of a pecific token and amount of tokens to be deposited
    function depositTokens(address _token, uint _amount) public {
        // "Token(_token)" creates an instance of token contract deployed at "_token" address
        // this allows any function in "Token.sol" contract to be called
        // calls "transferFrom(address _from, address _to, uint256 _value) public returns (bool success)" function
        // assuming that an allowance has been established: "allowance[msg.sender][address(this)]"
        // i.e. "address(this)" is allowed to transfer tokens from "msg.sender" account to a third account
        // transfers tokens from "msg.sender" account to "address(this)" (i.e. third account/exchange account)
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        // does not allow Ether to be deposited using this function
        require(_token != ETHER);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender] );
    }

}

