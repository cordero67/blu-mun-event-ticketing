//const { assert } = require("chai");

const { assert } = require("chai");

//import { tokens } from "./helpers";
const Token = artifacts.require("./Token");
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
contract("Exchange", ([deployer, feeAccount, user1]) => {
  let token;
  let exchange;
  const feePercent = 10;
  console.log("Inside Exchange");
  const ETHER_ADDRESS = "0x0000000000000000000000000000000000000000";

  beforeEach(async () => {
    // deploys "Token" contract
    token = await Token.new();
    // deploys "Exchange" contract
    exchange = await Exchange.new(feeAccount, feePercent);
    // transfers tokens to "user1" account
    let result = await token.transfer(user1, tokens(10), { from: deployer });
  });

  describe("deployment", () => {
    it("tracks the fee account", async () => {
      const result = await exchange.feeAccount();
      assert.equal(result, feeAccount, "the feeAccount is not recorded");
    });

    it("tracks the fee percent", async () => {
      const result = await exchange.feePercent();
      //console.log("Result: ", result);
      //console.log("feePercent: ", feePercent);
      assert.equal(result, feePercent, "the feePercent is not recorded");
    });
  });

  describe("fallback function", () => {
    let amount;
    amount = tokens(2);
    it("reverts if ether is sent directly to exchange", async () => {
      try {
        await exchange.sendTransaction({
          from: user1,
          value: amount,
        });
        assert(false);
      } catch (error) {
        assert(true);
      }
    });
  });

  describe("deposit ether", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(1);
      // deposits ether from "user1" to "exchange"
      result = await exchange.depositEther({ from: user1, value: amount });
    });
    it("tracks the ether balance", async () => {
      let balance;
      // check token balance on exchange   contract
      balance = await exchange.tokens(ETHER_ADDRESS, user1);
      assert.equal(
        balance,
        amount,
        "the token balance was not recorded successfully"
      );
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
        "the to amount should be tokens(10)"
      );
      //console.log("args.amount: ", log.args.amount);
      assert.equal(
        log.args.balance,
        amount,
        "the balance amount should be tokens(10)"
      );
      //console.log("args.balance: ", log.args.balance);
    });
  });

  describe("withraw ether", () => {
    let result;
    let amount;

    beforeEach(async () => {
      amount = tokens(2);
      // deposits ether from "user1" to "exchange"
      await exchange.depositEther({ from: user1, value: amount });
    });
    describe("successful withdrawal", async () => {
      beforeEach(async () => {
        amount = tokens(2);
        // withdraws ether from "exchange" to "user1"
        result = await exchange.withdrawEther(amount, { from: user1 });
      });
      it("withdraws ether", async () => {
        const balance = await exchange.tokens(ETHER_ADDRESS, user1);
        assert.equal(tokens(0), balance, "did not record ether withdrawal");
      });

      it("emits a Withdrawal event", async () => {
        const log = result.logs[0];
        //console.log("log: ", log);
        assert.equal(
          log.event,
          "Withdrawal",
          "should have fired a Withdrawal event"
        );
        //console.log("event: ", log.event);
        assert.equal(log.args.user, user1, "the uesr address should be user1");
        //console.log("args.user: ", log.args.user);
        assert.equal(
          log.args.amount,
          amount,
          "the to amount should be tokens(0)"
        );
        //console.log("args.amount: ", log.args.amount);
        assert.equal(
          log.args.balance,
          tokens(0),
          "the balance amount should be tokens(0)"
        );
        //console.log("args.balance: ", log.args.balance);
      });
    });

    describe("failed withdrawal", async () => {
      it("rejects for insufficient balance", async () => {
        amount = tokens(14);
        try {
          // withdraws ether from "exchange" to "user1"
          result = await exchange.withdrawEther(amount, { from: user1 });
          assert(false);
        } catch (error) {
          assert.ok(error);
        }
      });
    });
  });
  describe("deposits tokens", () => {
    let result;
    let amount;

    describe("successful deposit", () => {
      beforeEach(async () => {
        amount = tokens(10);
        // approve token allowance of "exchange" to spend "user1" tokens
        await token.approve(exchange.address, amount, { from: user1 });

        // deposits tokens from "user1" to "exchange"
        result = await exchange.depositTokens(token.address, amount, {
          from: user1,
        });
      });
      it("tracks the token deposit", async () => {
        let balance;
        // check token balance on token contract
        balance = await token.balanceOf(exchange.address);
        assert.equal(balance, amount, "the token transfer was not successful");
        // check token balance on exchange   contract
        balance = await exchange.tokens(token.address, user1);
        assert.equal(
          balance,
          amount,
          "the token balance was not recorded successfully"
        );
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
          "the to amount should be tokens(10)"
        );
        //console.log("args.amount: ", log.args.amount);
        assert.equal(
          log.args.balance,
          amount,
          "the balance amount should be tokens(10)"
        );
        //console.log("args.balance: ", log.args.balance);
      });
    });

    describe("failed deposit", () => {
      amount = tokens(10);
      it("rejects ether deposits", async () => {
        try {
          await exchange.depositTokens(ETHER_ADDRESS, amount, {
            from: user1,
          });
          assert(false);
        } catch (error) {
          assert(error);
        }
      });
      it("rejects deposit without appropriate allowance level", async () => {
        try {
          await exchange.depositTokens(token.address, amount, {
            from: user1,
          });
          assert(false);
        } catch (error) {
          assert(error);
        }
      });
    });
  });
});
