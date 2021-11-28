//import { tokens } from "./helpers";

const { assert } = require("chai");

//const Token = artifacts.require("./Token");
const Ticket = artifacts.require("./GAEventTickets");
const Exchange = artifacts.require("./Exchange");

//require("chai").use(require("chai-as-promised")).should();

// Helper function
const tokens = (_number) => {
  //console.log("Input: ", _number);
  const result = web3.utils.toWei(_number.toString(), "ether");
  //console.log("Output: ", result);
  return result;
};

// injects all the accounts from the ganache locally created blockchain
//contract("token", (accounts) => {
contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
  let token;
  let ticket;
  let exchange;
  const feePercent = 10;
  console.log("Inside Exchange");
  const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";


  const name = "Blu Mun GA Tickets";
  const symbol = "BLMN";
  const tickets = 1000000;
  const decimals = "0";
  const primaryPrice = 100;

  beforeEach(async () => {
    // deploys "Token" contract
    //token = await Token.new();
    // deploys "Ticket" contract
    token = await Ticket.new(name, symbol, tickets, primaryPrice, deployer);
    
    // deploys "Exchange" contract
    exchange = await Exchange.new(feeAccount, feePercent);
    // transfers tokens to "user1" account
    await token.transfer(user1, 100, { from: deployer });
  });
/*
  describe("deployment", () => {
    it("tracks the fee account", async () => {
      console.log("before feeAccount");
      const result = await exchange.feeAccount();
      console.log("result: ", result);
      console.log("feeAccount: ", feeAccount);
      assert.equal(result, feeAccount, "the feeAccount is not recorded");
    });

    it("tracks the fee percent", async () => {
      const result = await exchange.feePercent();
      assert.equal(result, feePercent, "the feePercent is not recorded");
    });
  });

  describe("Fallback function", () => {
    it("revert if ether is sent", async () => {
      try {
        await exchange.sendTransaction({ value: 1, from: user1 });
        assert(false);
      } catch (error) {
        assert.ok(error);
      }
    });
  });

  describe("deposit Ether", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = 1;
      result = await exchange.depositEther({
        from: user1,
        value: amount,
      });
    });

    it("tracks ether deposits", async () => {
      const balance = await exchange.tokens(ETHER_ADDRESS, user1);
      assert.equal(balance, amount.toString(), "did not track ether balance");
    });

    it("emits a Deposit event", async () => {
      //console.log(result.logs);
      const log = result.logs[0];
      assert.equal(log.event, "Deposit", "generated log");
      const event = log.args;
      assert.equal(event.token, ETHER_ADDRESS, "token address is correct");
      assert.equal(event.amount, amount, "amount is correct");
      assert.equal(event.balance, amount, "exchange balance is correct");
    });
  });

  describe("withdraw Ether", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = 1;
      result = await exchange.depositEther({
        from: user1,
        value: amount,
      });
    });

    describe("success", () => {
      beforeEach(async () => {
        result = await exchange.withdrawEther(amount, {
          from: user1,
        });
      });

      it("withdraw Ether funds", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        assert.equal(balance, "0", "withdraws ether");
      });

      it("emits a Withdraw event", async () => {
        //console.log(result.logs);
        const log = result.logs[0];
        assert.equal(log.event, "Withdrawal", "event is correct");
        const event = log.args;
        assert.equal(event.token, ETHER_ADDRESS, "token address is correct");
        assert.equal(event.amount, amount, "amount is correct");
        assert.equal(event.balance, "0", "exchange balance is correct");
      });
    });

    describe("failure", () => {
      it("rejects withdrawals for insufficient balances", async () => {
        try {
          await exchange.withdrawEther(100, { from: user1 });
          assert(false);
        } catch (error) {
          assert.ok(error);
        }
      });
    });
  });

  describe("deposit tokens", () => {
    let result;
    let amount;

    describe("successful deposit", () => {
      beforeEach(async () => {
        amount = 10;
        // approve token allowance of "exchange" to spend "user1" tokens
        await token.approve(exchange.address, amount, { from: user1 });

        // deposits tokens from "user1" to "exchange"
        result = await exchange.depositToken(token.address, amount, {
          from: user1,
        });
      });
      it("tracks the token deposit", async () => {
        let balance;
        // check token balance on token contract
        //balance = await token.balanceOf(exchange.address);
        //assert.equal(balance, amount, "the token transfer was not successful");
        // check token balance on exchange   contract
        //balance = await exchange.tokens(token.address, user1);
        //assert.equal(
        //  balance,
        //  amount,
        //  "the token balance was not recorded successfully"
        //);
      });
      it("emits a Deposit event", async () => {
        const log = result.logs[0];
        //console.log("log: ", log);
        assert.equal(log.event, "Deposit", "should have fired a Deposit event");
        //console.log("event: ", log.event);
        assert.equal(log.args.user, user1, "the uesr address should be user1");
        //console.log("args.user: ", log.args.user);
        assert.equal(
          log.args.amount,
          amount,
          "the to amount should be 10"
        );
        //console.log("args.amount: ", log.args.amount);
        assert.equal(
          log.args.balance,
          amount,
          "the balance amount should be 10"
        );
        //console.log("args.balance: ", log.args.balance);
      });
    });

    describe("failed deposit", () => {
      amount = 10;
      it("rejects ether deposits", async () => {
        try {
          await exchange.depositToken(ETHER_ADDRESS, amount, {
            from: user1,
          });
          assert(false);
        } catch (error) {
          assert(error);
        }
      });
      it("rejects deposit without appropriate allowance level", async () => {
        try {
          await exchange.depositToken(token.address, amount, {
            from: user1,
          });
          assert(false);
        } catch (error) {
          assert(error);
        }
      });
    });
  });

  describe("withdraw tokens", () => {
    let result;
    let amount;

    describe("success", () => {
      beforeEach(async () => {
        amount = 10;
        // this makes the initial token deposit to set up the withdrawal test
        await token.approve(exchange.address, amount, { from: user1 });
        await exchange.depositToken(token.address, amount, {
          from: user1,
        });
        // this then makes a withdrawal of these tokens
        result = await exchange.withdrawToken(token.address, amount, {
          from: user1,
        });
      });

      it("withdraw token funds", async () => {
        const balance = await exchange.tokens(token.address, user1);
        assert.equal(balance, "0", "token withdrawal captured");
      });

      it("emits a Withdraw event", async () => {
        //console.log(result.logs);
        const log = result.logs[0];
        assert.equal(log.event, "Withdrawal", "log records event type");
        const event = log.args;
        assert.equal(event.token, token.address, "token address is correct");
        assert.equal(event.user, user1, "user address is correct");
        assert.equal(event.amount, amount, "amount is correct");
        assert.equal(event.balance, "0", "exchange balance is correct");
      });
    });

    describe("failure", () => {
      it("rejects Ether withdrawals", async () => {
        try {
          await exchange.withdrawToken(ETHER_ADDRESS, 10, {
            from: user1,
          });
          assert(false);
        } catch (error) {
          assert.ok(error.message);
        }
      });

      it("rejects withdrawals for insufficient balances", async () => {
        try {
          await exchange.withdrawToken(token.address, 10, {
            from: user1,
          });
          assert(false);
        } catch (error) {
          assert.ok(error.message);
        }
      });
    });
  });

  describe("check balances", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = 1;
      result = await exchange.depositEther({
        from: user1,
        value: amount,
      });
    });

    it("checks balances", async () => {
      result = await exchange.balanceOf(ETHER_ADDRESS, user1);
      assert.equal(result, 1, "returns a balance");
    });
  });

  describe("making orders", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = 1;
      result = await exchange.makeOrder(
        token.address,
        amount,
        ETHER_ADDRESS,
        amount,
        {
          from: user1,
        }
      );
    });

    it("tracks new order", async () => {
      const orderCount = await exchange.orderCount();
      assert.equal(orderCount, "1", "tracks order count");
      const order = await exchange.orders("1");
      assert.equal(order.id, "1", "id is correct");
      assert.equal(order.user, user1, "user is correct");
      assert.equal(order.tokenGet, token.address, "tokenGet is correct");
      assert.equal(order.amountGet, 1, "amountGet is correct");
      assert.equal(order.tokenGive, ETHER_ADDRESS, "tokenGive is correct");
      assert.equal(order.amountGive, 1, "amountGive is correct");
    });

    it("emits an Order event", async () => {
      //console.log(result.logs);
      const log = result.logs[0];
      assert.equal(log.event, "Order", "records correct event type");
      const event = log.args;

      assert.equal(event.id, "1", "id address is correct");
      assert.equal(event.user, user1, "user address is correct");
      assert.equal(
        event.tokenGet,
        token.address,
        "tokenGet address is correct"
      );
      assert.equal(event.amountGet, 1, "amountGet amount is correct");
      assert.equal(
        event.tokenGive,
        ETHER_ADDRESS,
        "tokenGive address is correct"
      );
      assert.equal(
        event.amountGive,
        1,
        "tokenGive amount is correct"
      );
    });
  });
*/
  describe("order actions", () => {
    beforeEach(async () => {
      // user1 deposits ETHER into exchange
      await exchange.depositEther({ from: user1, value: 10 });
      // give user2 some tokens
      await token.transfer(user2, 100, { from: deployer });
      // user2 allows exchange to transfer/spend some of its tokens
      await token.approve(exchange.address, 20, { from: user2 });
      // user2 deposits tokens into exchange
      await exchange.depositToken(token.address, 20, { from: user2 });
      // creates test order
      await exchange.makeOrder(
        token.address,
        10,
        ETHER_ADDRESS,
        10,
        { from: user1 }
      );
    });

    describe("cancel order", () => {
      let result;

      describe("success", () => {
        beforeEach(async () => {
          result = await exchange.cancelOrder("1", { from: user1 });
        });

        it("order is in ordersCancelled", async () => {
          let cancelled = await exchange.ordersCancelled(1);
          assert.equal(cancelled, true, "order was cancelled");
        });

        it("emits a Cancel event", async () => {
          //console.log(result.logs);
          const log = result.logs[0];
          assert.equal(log.event, "Cancel", "records the correct event");
          const event = log.args;

          assert.equal(event.id, "1", "id address is correct");
          assert.equal(event.user, user1, "user address is correct");
          assert.equal(
            event.tokenGet,
            token.address,
            "tokenGet address is correct"
          );
          assert.equal(
            event.amountGet,
            10,
            "amountGet amount is correct"
          );
          assert.equal(
            event.tokenGive,
            ETHER_ADDRESS,
            "tokenGive address is correct"
          );
          assert.equal(
            event.amountGive,
            10,
            "tokenGive amount is correct"
          );
        });
      });

      describe("failure", () => {
        it("rejects an invalid order", async () => {
          try {
            await exchange.cancelOrder("999", { from: user1 });
            assert(false);
          } catch (error) {
            assert.ok(error.message);
          }
        });

        it("rejects an unauthorized order", async () => {
          try {
            await exchange.cancelOrder("1", { from: deployer });
            assert(false);
          } catch (error) {
            assert.ok(error.message);
          }
        });
      });
    });

    describe("fill order", () => {
      let result;

      describe("success", () => {
        beforeEach(async () => {
          // user2 fills the order
          result = await exchange.fillOrder("1", { from: user2 });
        });
        it("executes trade and charges fees", async () => {
          let balance;
          balance = await exchange.balanceOf(token.address, user1); //
          assert.equal(balance, 10, "user1 Token balance is correct");

          balance = await exchange.balanceOf(ETHER_ADDRESS, user2); //
          assert.equal(
            balance,
            10,
            "user2 ETHER balance is correct"
          );

          balance = await exchange.balanceOf(ETHER_ADDRESS, user1); //
          assert.equal(balance, "0", "user1 ETHER balance is correct");

          balance = await exchange.balanceOf(token.address, user2); //
          console.log("balance: ", balance);
          assert.equal(balance, 9, "user2 Token balance is correct");
          const feeAccount = await exchange.feeAccount();
          balance = await exchange.balanceOf(token.address, feeAccount);
          assert.equal(
            balance,
            1,
            "feeAccount Token balance is correct"
          );
        });

        it("updates filled orders", async () => {
          let orderFilled = await exchange.ordersFilled("1");
          assert.equal(orderFilled, true, "order was filled");
        });

        it("emits a Trade event", async () => {
          //console.log(result.logs);
          const log = result.logs[0];
          assert.equal(log.event, "Trade", "records Trade event");
          const event = log.args;

          assert.equal(event.id, "1", "id address is correct");

          assert.equal(event.user, user1, "user address is correct");
          assert.equal(
            event.tokenGet,
            token.address,
            "tokenGet address is correct"
          );
          assert.equal(
            event.amountGet,
            10,
            "amountGet amount is correct"
          );
          assert.equal(
            event.tokenGive,
            ETHER_ADDRESS,
            "tokenGive address is correct"
          );
          assert.equal(
            event.amountGive,
            10,
            "tokenGive amount is correct"
          );
          assert.equal(event.userFill, user2, "user address is correct");
          //assert.equal(event.timestamp, 1, "timestamp is present");
        });
      });

      describe("failure", () => {
        it("rejects an invalid order id", async () => {
          try {
            await exchange.fillOrder("999", { from: user2 });
            assert(false);
          } catch (error) {
            assert.ok(error.message);
          }
        });

        it("rejects an already filled order", async () => {
          //await exchange.fillOrder("1", { from: user2 }).should.be.fulfilled;
          try {
            await exchange.fillOrder("1", { from: user2 });
            assert(false);
          } catch (error) {
            assert.ok(error.message);
          }
        });

        it("rejects cancelled order", async () => {
          //await exchange.cancelOrder("1", { from: user1 }).should.be.fulfilled;
          try {
            await exchange.fillOrder("1", { from: user2 });
            assert(false);
          } catch (error) {
            assert.ok(error.message);
          }
        });
      });
    });
  });
});
