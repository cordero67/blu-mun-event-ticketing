// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

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