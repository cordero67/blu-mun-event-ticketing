// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
//import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
// ----------------------------------------------------------------------------

contract ERC20Interface {
    // Public state variables that automatic receive a getter() function
    // OPTIONAL: function name() public view returns (string memory name);
    string public name;

    // OPTIONAL: function symbol() public view returns (string memory symbol);
    string public symbol;

    // OPTIONAL: function decimals() public view returns (uint8 decimals);
    uint256 public decimals;

    // function totalSupply() public view returns (uint256 totalSupply);
    uint256 public totalSupply;

    // function balanceOf(address _owner) public view returns (uint256 balanceOf);
    mapping(address => uint256) public balanceOf;

    // function allowance(address _owner, address _spender) public view returns (uint256 allowance);
    mapping(address => mapping(address => uint256)) public allowance;

    // Functions
    function transfer(address _to, uint256 _value)
        public
        returns (bool success);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success);

    function approve(address _spender, uint256 _value)
        public
        returns (bool success);

    // Events
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );
}

contract EventTicketingFactory {
    address public manager;
    address[] public deployedGAEvents;
    mapping(address => Details) public details;

    struct Details {
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 primaryPrice;
        address creator;
    }

    constructor() public {
        manager = msg.sender;
    }
    
    function createGATickets(string memory _name, string memory _symbol, uint256 _tickets, uint256 _primaryPrice) public returns(address) {
        address newGAEvent = address(new GAEventTickets(_name, _symbol, _tickets, _primaryPrice, msg.sender));
        deployedGAEvents.push(newGAEvent);
        details[newGAEvent] = Details({
            name: _name,
            symbol: _symbol,
            totalSupply: _tickets,
            primaryPrice: _primaryPrice,
            creator: msg.sender
        });
        return newGAEvent;
    }
    
    function getDeployedGAEventTickets() public view returns(address[] memory) {
        return deployedGAEvents;
    }
}

// Code from DAPP University
// @title A title that should describe the contract/interface
/// @author The name of the author
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract GAEventTickets is ERC20Interface {
    //using SafeMath for uint256;

    string public name;
    string public symbol;
    uint256 public decimals = 0; // since these are not tokens make decimals "0"
    uint256 public totalSupply;
    uint256 public primaryPrice; // NOT part of ERC20Interface/Standard
    address public creator; // NOT part of ERC20Interface/Standard
    uint public refunded;
    State public state;

    // keeps track of each address' ticket balance
    mapping(address => uint256) public balanceOf;

    // keeps track of amount of an address' tokens that can be transferred by another addresses
    // first "address" is the address that provides the allowance and has the tokens
    // second "address" is the address that is allowed to transfer the allowance using "approve()"
    // transfer is performed by "transferFrom()" where receiver can be second address or a third party address
    mapping(address => mapping(address => uint256)) public allowance;

    enum State {ForSale, Paused, PreSale, Ended}

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(string memory _name, string memory _symbol, uint256 _tickets, uint256 _primaryPrice, address _creator) public {
        name = _name;
        symbol = _symbol;
        totalSupply = _tickets * (10**decimals);
        primaryPrice = _primaryPrice;
        creator = _creator; // identify contract deployer as creator
        balanceOf[creator] = totalSupply; // give all initial token supply to creator
    }

    // helper function that performs token exchange between accounts
    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal returns (bool success) {
        balanceOf[_from] -= _value;
        //balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] += _value;
        //balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    // Transfers _value amount of tokens from msg.sender to address _to, and MUST fire the Transfer event.
    // The function SHOULD throw if the message caller's account balance does not have enough tokens to spend.
    function transfer(address _to, uint256 _value)
        public
        returns (bool)
    {
        require(balanceOf[msg.sender] >= _value && _value > 0);
        require(_to != address(0), "bad address");
        _transfer(msg.sender, _to, _value);
        return true;
    }

    // msg.sender approves an amount of their tokens that can be transferred by second account
    // to third account to be specified in "transferFrom()"
    // second and third accounts can be the same address
    // e.g. msg.sender approves an exchange to transfer some of its tokens to a buyer
    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        require(_spender != address(0), "bad address");
        allowance[msg.sender][_spender] += _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function contractBalance() public view returns (uint) {
        return address(this).balance;
    }

    // transfers tokens from one account "_from" to second account "_to" by a third account ("msg.sender")
    // second and third accounts can be the same address
    // third account must be approved by first account i.e. first account's tokens that will be transferred
    // allowance amount defined by "allowance[_from][msg.sender]" must be established
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        // checks that the third account has adequant allowance level
        require(allowance[_from][msg.sender] >= _value && _value > 0);
        // checks that the first account has adequant token amount
        require(balanceOf[_from] >= _value && _value > 0);
        // checks that the second account is a real address
        require(_to != address(0), "bad address");
        // adjusts allowance level of third account
        allowance[_from][msg.sender] -= _value;
        //allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        // performs the transfer from first to second account
        _transfer(_from, _to, _value);
        return true;
    }

    function setToForSale () public returns(bool) {
        require(msg.sender == creator);
        state = State.ForSale;
    }
    
    function setToPaused () public returns(bool) {
        require(msg.sender == creator);
        state = State.Paused;
    }
    
    function setToPresale () public returns(bool) {
        require(msg.sender == creator);
        state = State.PreSale;
    }
    
    function setToEnded () public returns(bool) {
        require(msg.sender == creator);
        state = State.Ended;
    }

    function primaryTransfer(uint _qty) public payable returns (uint amountToRefund) {
        // checks that amount sent can pay for amount of tickets to be purchased
        require(state == State.ForSale);
        // checks that amount sent can pay for amount of tickets to be purchased
        require(msg.value >= _qty * primaryPrice);
        // checks that creator has enough tickets to satisfy amount of tickets to be purchased
        require(balanceOf[creator] >= _qty);
        
        balanceOf[creator] -= _qty;
        //balanceOf[creator] = balanceOf[creator].sub(_qty);
        balanceOf[msg.sender] += _qty;
        //balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(creator, msg.sender, _qty);

        // returns excess value sent;
        amountToRefund = msg.value - (primaryPrice * _qty);
        refunded = amountToRefund;
        msg.sender.transfer(amountToRefund);
        
        return amountToRefund;
    }
}


/*
// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
//import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
// ----------------------------------------------------------------------------

contract ERC20Interface {
    // Public state variables that automatic receive a getter() function
    // OPTIONAL: function name() public view returns (string memory name);
    string public name;

    // OPTIONAL: function symbol() public view returns (string memory symbol);
    string public symbol;

    // OPTIONAL: function decimals() public view returns (uint8 decimals);
    uint256 public decimals;

    // function totalSupply() public view returns (uint256 totalSupply);
    uint256 public totalSupply;

    // function balanceOf(address _owner) public view returns (uint256 balanceOf);
    mapping(address => uint256) public balanceOf;

    // function allowance(address _owner, address _spender) public view returns (uint256 allowance);
    mapping(address => mapping(address => uint256)) public allowance;

    // Functions
    function transfer(address _to, uint256 _value)
        public
        returns (bool success);

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success);

    function approve(address _spender, uint256 _value)
        public
        returns (bool success);

    // Events
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(
        address indexed _owner,
        address indexed _spender,
        uint256 _value
    );
}

contract EventTicketingFactory {
    address public manager;
    address[] public deployedGAEvents;
    mapping(address => Details) public details;

    struct Details {
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 primaryPrice;
        address creator;
    }

    constructor() public {
        manager = msg.sender;
    }
    
    function createGATickets(string memory _name, string memory _symbol, uint256 _tickets, uint256 _primaryPrice) public returns(address) {
        address newGAEvent = address(new GAEventTickets(_name, _symbol, _tickets, _primaryPrice, msg.sender));
        deployedGAEvents.push(newGAEvent);
        details[newGAEvent] = Details({
            name: _name,
            symbol: _symbol,
            totalSupply: _tickets,
            primaryPrice: _primaryPrice,
            creator: msg.sender
        });
        return newGAEvent;
    }
    
    function getDeployedGAEventTickets() public view returns(address[] memory) {
        return deployedGAEvents;
    }
}

// Code from DAPP University
// @title A title that should describe the contract/interface
/// @author The name of the author
/// @notice Explain to an end user what this does
/// @dev Explain to a developer any extra details
contract GAEventTickets is ERC20Interface {
    //using SafeMath for uint256;

    string public name;
    string public symbol;
    uint256 public decimals = 0; // since these are not tokens make decimals "0"
    uint256 public totalSupply;
    uint256 public primaryPrice; // NOT part of ERC20Interface/Standard
    address public creator; // NOT part of ERC20Interface/Standard
    uint public refunded;

    // keeps track of each address' ticket balance
    mapping(address => uint256) public balanceOf;

    // keeps track of amount of an address' tokens that can be transferred by another addresses
    // first "address" is the address that provides the allowance and has the tokens
    // second "address" is the address that is allowed to transfer the allowance using "approve()"
    // transfer is performed by "transferFrom()" where receiver can be second address or a third party address
    mapping(address => mapping(address => uint256)) public allowance;

    enum State {Running, Stopped, Inactive}

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    constructor(string memory _name, string memory _symbol, uint256 _tickets, uint256 _primaryPrice, address _creator) public {
        name = _name;
        symbol = _symbol;
        totalSupply = _tickets * (10**decimals);
        primaryPrice = _primaryPrice;
        creator = _creator; // identify contract deployer as creator
        balanceOf[creator] = totalSupply; // give all initial token supply to creator
    }

    // helper function that performs token exchange between accounts
    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal returns (bool success) {
        balanceOf[_from] -= _value;
        //balanceOf[_from] = balanceOf[_from].sub(_value);
        balanceOf[_to] += _value;
        //balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    // Transfers _value amount of tokens from msg.sender to address _to, and MUST fire the Transfer event.
    // The function SHOULD throw if the message caller's account balance does not have enough tokens to spend.
    function transfer(address _to, uint256 _value)
        public
        returns (bool)
    {
        require(balanceOf[msg.sender] >= _value && _value > 0);
        require(_to != address(0), "bad address");
        _transfer(msg.sender, _to, _value);
        return true;
    }

    // msg.sender approves an amount of their tokens that can be transferred by second account
    // to third account to be specified in "transferFrom()"
    // second and third accounts can be the same address
    // e.g. msg.sender approves an exchange to transfer some of its tokens to a buyer
    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        require(_spender != address(0), "bad address");
        allowance[msg.sender][_spender] += _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    function contractBalance() public view returns (uint) {
        return address(this).balance;
    }

    // transfers tokens from one account "_from" to second account "_to" by a third account ("msg.sender")
    // second and third accounts can be the same address
    // third account must be approved by first account i.e. first account's tokens that will be transferred
    // allowance amount defined by "allowance[_from][msg.sender]" must be established
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        // checks that the third account has adequant allowance level
        require(allowance[_from][msg.sender] >= _value && _value > 0);
        // checks that the first account has adequant token amount
        require(balanceOf[_from] >= _value && _value > 0);
        // checks that the second account is a real address
        require(_to != address(0), "bad address");
        // adjusts allowance level of third account
        allowance[_from][msg.sender] -= _value;
        //allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        // performs the transfer from first to second account
        _transfer(_from, _to, _value);
        return true;
    }
    
    function primaryTransfer(uint _qty) public payable returns (uint amountToRefund) {
        // checks that amount sent can pay for amount of tickets to be purchased
        require(msg.value >= _qty * primaryPrice);
        // checks that creator has enough tickets to satisfy amount of tickets to be purchased
        require(balanceOf[creator] >= _qty);
        
        balanceOf[creator] -= _qty;
        //balanceOf[creator] = balanceOf[creator].sub(_qty);
        balanceOf[msg.sender] += _qty;
        //balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(creator, msg.sender, _qty);

        // returns excess value sent;
        amountToRefund = msg.value - (primaryPrice * _qty);
        msg.sender.transfer(amountToRefund);
        refunded = amountToRefund;
        
        return amountToRefund;
    }
}
*/