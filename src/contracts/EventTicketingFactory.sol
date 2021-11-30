// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
// ----------------------------------------------------------------------------

/// @title The ERC20 interface used to develop the GAEventTickets contract
contract ERC20Interface {
    // Public state variables that automatic receive a getter() function
    /// @custom OPTIONAL: function name() public view returns (string memory name);
    string public name;

    /// @custom OPTIONAL: function symbol() public view returns (string memory symbol);
    string public symbol;

    /// @custom OPTIONAL: function decimals() public view returns (uint8 decimals);
    uint256 public decimals;

    /// @custom function totalSupply() public view returns (uint256 totalSupply);
    uint256 public totalSupply;

    /// @notice function balanceOf(address _owner) public view returns (uint256 balanceOf);
    mapping(address => uint256) public balanceOf;

    /// @notice function allowance(address _owner, address _spender) public view returns (uint256 allowance);
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
    /// @notice Keeps track of ticket factory manager
    address public manager;
    /// @notice An array of all deployed contract addresses
    address[] public deployedGAEvents;
    /// @notice A mapping of the event details of every deployed contract
    mapping(address => Details) public details;

    /// @notice Struct definition to hold event details
    struct Details {
        string name;
        string symbol;
        uint256 totalSupply;
        uint256 primaryPrice;
        address creator;
    }

    /// @notice Sets manager of EventTicketingFactory contract to initial contract deployer
    constructor() public {
        manager = msg.sender;
    }
    
    /// @notice Launches a new GAEvent smart contract
    /// @notice Stores the new contract's address in deployedGAEvents array
    /// @notice Stores the new contract's details in details mapping
    /// @return A new GAEvent contract
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
    
    /// @notice Simple function to retrieve the entire deployedGAEvents array
    /// @return Array that holds the address of all deployed contracts
    function getDeployedGAEventTickets() public view returns(address[] memory) {
        return deployedGAEvents;
    }
}

/// @title Creates a contract that represents General Admission tickets using the ERC20 standard
/// @author Rafael Cordero
/// @notice This contract executes the initial sale of tickets, i.e. the Primary Market
/// @dev Includes additional functionality that is not part of ERC20 standard
contract GAEventTickets is ERC20Interface {
    using SafeMath for uint256;

    /// @notice Stores the tickets name
    string public name;
    /// @notice Stores the tickets symbol
    string public symbol;
    /// @notice Stores the number of sub-units for each ticket
    /// @notice Since these are not tokens make decimals "0"
    uint256 public decimals = 0;
    /// @notice Keeps track of initial ticket quantity issued
    uint256 public totalSupply;
    /// @notice Keeps track of initial ticket price
    /// @notice NOT part of ERC20Interface/Standard
    uint256 public primaryPrice;
    /// @notice Keeps track of event creator address
    /// @notice NOT part of ERC20Interface/Standard
    address public creator;
    /// @notice Keeps track of most recent Eth refund caused by a ticket overpayment
    /// @notice NOT part of ERC20Interface/Standard
    uint public refunded;
    /// @notice Keeps track of the ticket sale state
    /// @notice NOT part of ERC20Interface/Standard
    State public state;

    /// @notice Keeps track of each address' ticket balance
    mapping(address => uint256) public balanceOf;

    /// @notice Keeps track of amount of an address' tokens that can be transferred by another addresses
    /// @notice First "address" is the address that provides the allowance and has the tokens
    /// @notice Second "address" is the address that is allowed to transfer the allowance using "approve()"
    /// @notice Transfer is performed by "transferFrom()" where receiver can be second address or a third party address
    mapping(address => mapping(address => uint256)) public allowance;

    /// @notice Defines the possible states of the ticket sale
    /// @notice NOT part of ERC20Interface/Standard
    enum State {ForSale, Paused, PreSale, Ended}

    /// @notice Defines a ticket sale/transfer with buyer, seller and ticket amount 
    event Transfer(address indexed from, address indexed to, uint256 value);
    /// @notice Defines a ticket transfer allowance with owner, spender and ticket amount 
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /// @notice Constructor function that asks for ticket name, symbol, initial quantity and initial price, and address of event creator
    /// @notice Gives the entire balance of tickets created to the event creator
    constructor(string memory _name, string memory _symbol, uint256 _tickets, uint256 _primaryPrice, address _creator) public {
        name = _name;
        symbol = _symbol;
        totalSupply = _tickets * (10**decimals);
        primaryPrice = _primaryPrice;
        creator = _creator; // identify contract deployer as creator
        balanceOf[creator] = totalSupply; // give all initial token supply to creator
    }

    /// @notice Helper function that performs token exchange between accounts
    /// @notice NOT part of ERC20Interface/Standard
    /// @return Transaction success as a Bool
    function _transfer(
        address _from,
        address _to,
        uint256 _value
    ) internal returns (bool success) {
        //balanceOf[_from] -= _value;
        balanceOf[_from] = balanceOf[_from].sub(_value);
        //balanceOf[_to] += _value;
        balanceOf[_to] = balanceOf[_to].add(_value);
        emit Transfer(_from, _to, _value);
        return true;
    }

    /// @notice Transfers _value amount of tokens from msg.sender to address _to, and MUST fire the Transfer event.
    /// @dev Function will revert if sender does not have sufficient tickets
    /// @dev Function will revert if number of tickets to transfer is not a positive number
    /// @dev Function will revert if transaction originates from a bad address
    /// @return Transaction success as a Bool
    function transfer(address _to, uint256 _value)
        public
        returns (bool)
    {
        require(balanceOf[msg.sender] >= _value && _value > 0);
        require(_to != address(0), "bad address");
        _transfer(msg.sender, _to, _value);
        return true;
    }

    /// @notice msg.sender approves an amount of their tokens that can be transferred by second account
    /// @notice to third account to be specified in "transferFrom()"
    /// @notice Second and third accounts can be the same address
    /// @notice e.g. msg.sender approves an exchange to transfer some of its tokens to a buyer
    /// @dev Function will revert if transaction originates from a bad address
    /// @return Transaction success as a Bool
    function approve(address _spender, uint256 _value)
        public
        returns (bool success)
    {
        require(_spender != address(0), "bad address");
        allowance[msg.sender][_spender] += _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }
    
    /// @notice Simple function to determine the ETH balance of this contract
    /// @notice NOT part of ERC20Interface/Standard
    /// @return The ETH balance of this contract in Wei
    function contractBalance() public view returns (uint) {
        return address(this).balance;
    }

    /// @notice Transfers tokens from one account "_from" to second account "_to" by a third account ("msg.sender")
    /// @notice Second and third accounts can be the same address
    /// @notice Third account must be approved by first account i.e. first account's tokens that will be transferred
    /// @notice Allowance amount defined by "allowance[_from][msg.sender]" must be established
    /// @dev Function will revert if sender does not have sufficient tickets
    /// @dev Function will revert if receiver does not have sufficient ticket allowance
    /// @dev Function will revert if number of tickets to transfer is not a positive number
    /// @dev Function will revert if transaction originates from a bad address
    /// @return Transaction success as a Bool
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
        //allowance[_from][msg.sender] -= _value;
        allowance[_from][msg.sender] = allowance[_from][msg.sender].sub(_value);
        // performs the transfer from first to second account
        _transfer(_from, _to, _value);
        return true;
    }

    /// @notice Changes the state of the contract to ForSale
    /// @notice NOT part of ERC20Interface/Standard
    /// @return Transaction success as a bool
    function setToForSale () public onlyOwner() returns(bool) {
        state = State.ForSale;
    }
    
    /// @notice Changes the state of the contract to Paused
    /// @notice NOT part of ERC20Interface/Standard
    /// @return Transaction success as a bool
    function setToPaused () public onlyOwner() returns(bool) {
        state = State.Paused;
    }
    
    /// @notice Changes the state of the contract to PreSale
    /// @notice NOT part of ERC20Interface/Standard
    /// @return Transaction success as a bool
    function setToPresale () public onlyOwner() returns(bool) {
        state = State.PreSale;
    }
    
    /// @notice Changes the state of the contract to Ended
    /// @notice NOT part of ERC20Interface/Standard
    /// @return Transaction success as a bool
    function setToEnded () public onlyOwner() returns(bool) {
        state = State.Ended;
    }

    /// @notice changes the state of the contract to Ended
    /// @notice NOT part of ERC20Interface/Standard
    modifier onlyOwner() {
        require(msg.sender == creator);
        _;
    }

    /// @notice Allowance amount defined by "allowance[_from][msg.sender]" must be established
    /// @notice Performs a ticket transfer from event creator to ticket buyer
    /// @notice Returns any amount of overpayment
    /// @notice NOT part of ERC20Interface/Standard
    /// @dev Function will revert if contract state is not ForSale
    /// @dev Function will revert amount sent does not cover the purchase price
    /// @dev Function will revert if event creator does not have enough tickets to cover the sale
    /// @return The amount of Eth in Wei returned to ticket buyer as a uint
    function primaryTransfer(uint _qty) public payable returns (uint amountToRefund) {
        // checks that amount sent can pay for amount of tickets to be purchased
        require(state == State.ForSale);
        // checks that amount sent can pay for amount of tickets to be purchased
        require(msg.value >= _qty * primaryPrice);
        // checks that creator has enough tickets to satisfy amount of tickets to be purchased
        require(balanceOf[creator] >= _qty);
        
        //balanceOf[creator] -= _qty;
        balanceOf[creator] = balanceOf[creator].sub(_qty);
        //balanceOf[msg.sender] += _qty;
        balanceOf[msg.sender] = balanceOf[msg.sender].add(_qty);
        emit Transfer(creator, msg.sender, _qty);

        // returns excess value sent;
        amountToRefund = msg.value - (primaryPrice * _qty);
        refunded = amountToRefund;
        msg.sender.transfer(amountToRefund);
        
        return amountToRefund;
    }
}
