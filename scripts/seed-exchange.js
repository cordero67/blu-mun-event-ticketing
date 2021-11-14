// Contracts
const Token = artifacts.require("Token");
const Exchange = artifacts.require("Exchange");

// Utils
const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000"; // Ether token deposit address
const ether = (n) => {
  return new web3.utils.BN(web3.utils.toWei(n.toString(), "ether"));
};

const tokens = (n) => ether(n);

// puases program for 1 second
const wait = (seconds) => {
  const milliseconds = seconds * 1000;
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

module.exports = async function (callback) {
  console.log("script is running");

  try {
    // Fetch accounts from wallet - these are unlocked
    const accounts = await web3.eth.getAccounts();

    // Fetch the deployed token
    const token = await Token.deployed();
    console.log("Token fetched", token.address);

    // Fetch the deployed exchange
    const exchange = await Exchange.deployed();
    console.log("Exchange fetched", exchange.address);

    // account[0] received all tokens upon "Token" deployment/issuance
    // Give tokens to account[1]
    const sender = accounts[0];
    const receiver = accounts[1];
    let amount = web3.utils.toWei("100000", "ether"); // 10,000 tokens

    // account[0], which initially has all the tokens issued, transfers 10,000 to account[1]
    await token.transfer(receiver, amount, { from: sender });
    console.log(`Transferred ${amount} tokens from ${sender} to ${receiver}`);

    // set up exchange users
    const user1 = accounts[0];
    const user2 = accounts[1];

    // user 1, user 2 and all ganache accounts start with 100 ether
    // user 1 Deposits Ether into Exchange
    amount = 1;
    await exchange.depositEther({ from: user1, value: ether(amount) });
    console.log(`Deposited ${amount} Ether from ${user1}`);

    // user 2 Approves Exchange to spend 10,000 of its tokens
    // the tokens are not transferred, but simpled allowed
    amount = 10000;
    await token.approve(exchange.address, tokens(amount), { from: user2 });
    console.log(`Approved ${amount} tokens from ${user2}`);

    // user 2 deposits 10,000 tokens into Exchange
    // "depositTokens" required that user2 gave exchange an allowance of 10,000 token to spend
    await exchange.depositToken(token.address, tokens(amount), { from: user2 });
    console.log(`Deposited ${amount} tokens from ${user2}`);

    /////////////////////////////////////////////////////////////
    // Seed a Cancelled Order
    //

    // first user1 makes order to get 100 tokens
    // function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive)
    let result;
    let orderId;
    result = await exchange.makeOrder(
      token.address,
      tokens(100),
      ETHER_ADDRESS,
      ether(0.1),
      { from: user1 }
    );
    console.log(`Made order from ${user1}`);

    // user 1 cancells order
    orderId = result.logs[0].args.id;
    await exchange.cancelOrder(orderId, { from: user1 });
    console.log(`Cancelled order from ${user1}`);

    /////////////////////////////////////////////////////////////
    // Seed Filled Orders
    //

    // yser 1 makes 1st order
    // function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive)
    result = await exchange.makeOrder(
      token.address,
      tokens(100),
      ETHER_ADDRESS,
      ether(0.1),
      { from: user1 }
    );
    console.log(`Made order from ${user1}`);

    // user 2 fills 1st order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`Filled order from ${user1}`);

    // Wait 1 second
    await wait(1);

    // user 1 makes 2nd order
    // function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive)
    result = await exchange.makeOrder(
      token.address,
      tokens(50),
      ETHER_ADDRESS,
      ether(0.01),
      { from: user1 }
    );
    console.log(`Made order from ${user1}`);

    // user 2 fills 2nd order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`Filled order from ${user1}`);

    // Wait 1 second
    await wait(1);

    // User 1 makes 3rd order
    // function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive)
    result = await exchange.makeOrder(
      token.address,
      tokens(200),
      ETHER_ADDRESS,
      ether(0.15),
      { from: user1 }
    );
    console.log(`Made order from ${user1}`);

    // User 2 fills 3rd order
    orderId = result.logs[0].args.id;
    await exchange.fillOrder(orderId, { from: user2 });
    console.log(`Filled order from ${user1}`);

    // Wait 1 second
    await wait(1);

    /////////////////////////////////////////////////////////////
    // Seed Open Orders
    //

    // User 1 makes 10 orders to buy tokens in exchange for ether
    for (let i = 1; i <= 10; i++) {
      // function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive)
      result = await exchange.makeOrder(
        token.address,
        tokens(10 * i),
        ETHER_ADDRESS,
        ether(0.01),
        { from: user1 }
      );
      console.log(
        `Made order from ${user1}: buy ${tokens(
          10 * i
        )} tokens and give ${ether(0.01)} ether`
      );
      // Wait 1 second
      await wait(1);
    }

    // User 2 makes 10 orders to sell tokens in exchange for ether
    for (let i = 1; i <= 10; i++) {
      // function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive)
      result = await exchange.makeOrder(
        ETHER_ADDRESS,
        ether(0.01),
        token.address,
        tokens(10 * i),
        { from: user2 }
      );
      console.log(
        `Made order from ${user2}: sell ${tokens(
          10 * i
        )} tokens ${i} and receive ${ether(0.01)} ether`
      );
      // Wait 1 second
      await wait(1);
    }
  } catch (error) {
    console.log(error);
  }

  callback();
};
