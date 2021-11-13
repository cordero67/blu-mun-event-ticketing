// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// imports the Token contract not a specific token
import "./Token.sol";

// TODO:
// [X] Set the fee account
// [X] Deposit Ether
// [X] Withdraw Ether
// [X] Deposit tokens
// [X] Withdraw tokens
// [X] Check balances
// [X] Make order
// [X] Cancel order
// [ ] Fill order
// [ ] Charge fees

contract Exchange {
    using SafeMath for uint256;

    address payable public feeAccount;
    uint256 public feePercent;
    address constant ETHER = address(0); // address that represents Ether deposits
    uint256 public orderCount; // tracks the number of orders placed on exchange


    // first address is the token address
    // second address is the address of the token holder who made deposit
    mapping(address => mapping(address => uint256)) public tokens;
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public ordersCancelled;
    

    event Deposit(address indexed token, address indexed user, uint256 amount, uint256 balance);
    event Withdrawal(
        address token,
        address user,
        uint256 amount,
        uint256 balance
    );
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );
    event Cancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    // Structs
    struct _Order {
        uint256 id;
        address user; // order creator
        address tokenGet; // address of token to be purchased
        uint256 amountGet; // amount of token to be purchased
        address tokenGive; // address of token to be provided
        uint256 amountGive; // amount of token to be provided
        uint256 timestamp; // time when order was created
    }

    constructor(address payable _feeAccount, uint _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // receives ether sent to this contract
    function depositEther() public payable {
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].add(msg.value);
        emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
    }

    //
    function withdrawEther(uint256 _amount) public payable {
        // checks if msg.sender has enough ETHER to sent
        require(tokens[ETHER][msg.sender] >= _amount);
        // updates the balances tracked inside the Exchange contract
        tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender].sub(_amount);
        // transfer() will send ether from the contract to the msg.sender address
        msg.sender.transfer(_amount);
        emit Withdrawal(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
    }

    // receives address of a pecific token and amount of tokens to be deposited
    function depositToken(address _token, uint _amount) public {
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

    function withdrawToken(address _token, uint256 _amount) public {
        // checks if msg.sender has enough tokens to withdraw
        require(tokens[_token][msg.sender] >= _amount);
        // do not allow token address to be valid
        require(_token != ETHER);
        // generates an instance of the Token contract on the Ethereum network
        // then runs the transfer() function
        // this will send tokens from the Exchange contract to msg.sender
        require(Token(_token).transfer(msg.sender, _amount));
        // updates the balances tracked inside the Exchange contract
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        emit Withdrawal(
            _token,
            msg.sender,
            _amount,
            tokens[_token][msg.sender]
        );
    }

    function balanceOf(address _token, address _user) public view returns(uint256) {
        return tokens[_token][_user];
    }

    function makeOrder(
        address _tokenGet,
        uint256 _amountGet,
        address _tokenGive,
        uint256 _amountGive
    ) public {
        orderCount = orderCount.add(1);
        orders[orderCount] = _Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            now
        );
        emit Order(
            orderCount,
            msg.sender,
            _tokenGet,
            _amountGet,
            _tokenGive,
            _amountGive,
            now
        );
    }

    function cancelOrder(uint256 _id) public {
        // extracts the specific order from the orders mapping that is in storage
        _Order storage _order = orders[_id];
        // checks that order creator matches the address that is trying to cancel order
        require(msg.sender == address(_order.user));
        // requires that id of order extracted matches id of order being cancelled
        require(_id == _order.id);
        // adds the order to the ordersCancelled mapping
        ordersCancelled[_id] = true;
        emit Cancel(
            _order.id,
            _order.user,
            _order.tokenGet,
            _order.amountGet,
            _order.tokenGive,
            _order.amountGive,
            now
        );
    }

}

