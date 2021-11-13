const GAEventTickets = artifacts.require("./GAEventTickets");

// injects all the accounts from ganache blockchain created locally
//contract("ticket", (accounts) => {
contract("GAEventTickets", ([deployer, receiver, exchange]) => {
  let ticket;
  const name = "Blu Mun GA Tickets";
  const symbol = "BLMN";
  const decimals = "0";
  const totalSupply = 1000000;

  beforeEach(async () => {
    //ticket = await GAEventTickets.new();
    ticket = await GAEventTickets.new(1000000, deployer);
  });

  describe("deployment", () => {
    it("tracks the name", async () => {
      const result = await ticket.name();
      assert.equal(result, name, "the name is not registered");
      //result.should.equal(name);
    });

    it("tracks the symbol", async () => {
      const result = await ticket.symbol();
      console.log("Symbol: ", symbol);
      assert.equal(result, symbol, "the symbol is not registered");
    });

    it("tracks the decimals", async () => {
      const result = await ticket.decimals();
      assert.equal(
        result.toString(),
        decimals,
        "the decimals is not registered"
      );
    });

    it("tracks the total supply", async () => {
      const result = await ticket.totalSupply();
      //console.log("result.toString(): ", result.toString());
      //console.log("totalSupply: ", totalSupply);
      assert.equal(result, totalSupply, "the totalSupply is not registered");
    });

    it("assigns the total ticket supply to the deployer", async () => {
      //const result = await ticket.balanceOf(accounts[0]);
      const result = await ticket.balanceOf(deployer);
      //console.log("result: ", result);
      //console.log("totalSupply: ", totalSupply);
      assert.equal(result, totalSupply, "totalSupply not sent to owner");
    });
  });

  describe("sending tickets", () => {
    let amount;
    let result;

    describe("successfull 'transfer()' transactions", () => {
      beforeEach(async () => {
        amount = 100;
        result = await ticket.transfer(receiver, amount, {
          from: deployer,
        });
      });
      it("transfers ticket balances", async () => {
        let balance;
        //balance = await ticket.balanceOf(deployer);
        //console.log("deployer balance before: ", balance.toString());
        //balance = await ticket.balanceOf(receiver);
        //console.log("recipient balance before: ", balance.toString());

        balance = await ticket.balanceOf(deployer);
        //console.log("deployer balance after: ", balance.toString());
        assert.equal(balance, 999900, "balance does not equal 999900");
        balance = await ticket.balanceOf(receiver);
        //console.log("recipient balance after: ", balance.toString());
        assert.equal(balance, 100, "balance does not equal 100");
      });

      it("emits a Transfer event", async () => {
        const log = result.logs[0];
        //console.log("log: ", log);
        assert.equal(
          log.event,
          "Transfer",
          "should have fired a Transfer event"
        );
        //console.log("args.from: ", log.args.from);
        //console.log("args.to: ", log.args.to);
        assert.equal(
          log.args.from,
          deployer,
          "the from address should be deployer"
        );
        assert.equal(
          log.args.to,
          receiver,
          "the to address should be receiver"
        );
        assert.equal(log.args.value, amount, "the value amount should be 100");
      });
    });

    // NEED TO REVISIT THIS, video 42:45: Token Tickets
    // The try catch block is not correct nor are the tests
    describe("failed 'transfer()' transactions", () => {
      it("rejects insufficient balances", async () => {
        let invalidAmount;

        invalidAmount = 0;

        let result = await ticket.balanceOf(receiver);
        //console.log("Result: ", result.toString());
        try {
          await ticket.transfer(deployer, invalidAmount, { from: receiver });
          //console.log("Amount is OK");
          assert(false);
        } catch (error) {
          //console.log("Error message: ", error.message);
          assert.equal(
            error.message,
            "Returned error: VM Exception while processing transaction: revert"
          );
        }

        try {
          await ticket.transfer(deployer, invalidAmount, { from: receiver });
          //console.log("Amount is OK");
          assert(false);
        } catch (error) {
          assert(error);
        }
        //console.log("Continuing");

        invalidAmount = 1000000000000000;
        try {
          await ticket.transfer(receiver, invalidAmount, { from: deployer });
          //console.log("Amount is GOOD");
        } catch (error) {
          assert.equal(
            error.message,
            "Returned error: VM Exception while processing transaction: revert"
          );
        }
      });
      /*
      it("reject invalid address", async () => {
        let invalidAddress = 0x0;
        //let invalidAddress = exchange;

        try {
          await ticket.transfer(invalidAddress, amount, { from: deployer });
          console.log("Address is VALID");
        } catch (error) {
          assert.equal(
            error.message,
            'AssertionError: expected "invalid address (arg="_to", coderType="address", value=0)" to equal "invalid address (arg="_spender", coderType="address", value=0)'
          );
          console.log("Address is NOT VALID");
        }

        console.log("Goodbye");
      });
      */
    });
  });

  describe("approving tickets", () => {
    let amount;
    let result;

    amount = 10;

    beforeEach(async () => {
      result = await ticket.approve(exchange, amount, { from: deployer });
    });

    describe("successfull 'approve()' transactions", () => {
      it("allocates a ticket allowance for delegated spending on an exchange", async () => {
        const allowance = await ticket.allowance(deployer, exchange, {
          from: deployer,
        });
        //console.log("Hello");
        assert.equal(
          allowance,
          amount,
          "did not suscessfully record allowance amount"
        );
      });

      it("emits an Allocate event", async () => {
        const log = result.logs[0];
        //console.log("log: ", log);
        assert.equal(
          log.event,
          "Approval",
          "should have fired an Approval event"
        );
        //console.log("args.from: ", log.args.from);
        //console.log("args.to: ", log.args.to);
        assert.equal(
          log.args.owner,
          deployer,
          "the owner address should be deployer"
        );
        assert.equal(
          log.args.spender,
          exchange,
          "the spender address should be receiver"
        );
        assert.equal(log.args.value, amount, "the value amount should be 10");
      });
    });

    // NEED TO REVISIT THIS, video 13:35: Delegated TokenTransfers
    // The try catch block is not correct nor are the tests
    describe("failed approve transactions", () => {
      /*
      it("reject invalid address", async () => {
        let invalidAddress = 0x0;
        //let invalidAddress = exchange;

        try {
          await ticket.approve(invalidAddress, amount, { from: deployer });
          console.log("Address is VALID");
        } catch (error) {
          assert.equal(
            error.message,
            'invalid address (arg="_spender", coderType="address", value=0)'
          );
          console.log("Address is NOT VALID");
        }

        console.log("Goodbye");
      });
      */
    });
  });

  describe("delegated ticket transfers", () => {
    let amount;
    let result;

    beforeEach(async () => {
      amount = 100;
      await ticket.approve(exchange, amount, { from: deployer });
    });

    describe("successfull 'transferFrom()' transactions", () => {
      beforeEach(async () => {
        result = await ticket.transferFrom(deployer, receiver, amount, {
          from: exchange,
        });
      });
      it("transfers ticket balances", async () => {
        let balance;
        balance = await ticket.balanceOf(deployer);
        assert.equal(balance, 999900, "balance does not equal 999900");
        balance = await ticket.balanceOf(receiver);
        assert.equal(balance, 100, "balance does not equal 100");
      });

      it("emits another Transfer event", async () => {
        //console.log("Result: ", result);
        const log = result.logs[0];
        //console.log("log: ", log);
        assert.equal(
          log.event,
          "Transfer",
          "should have fired a Transfer event"
        );
        //console.log("args.from: ", log.args.from);
        //console.log("args.to: ", log.args.to);
        assert.equal(
          log.args.from,
          deployer,
          "the from address should be deployer"
        );
        assert.equal(
          log.args.to,
          receiver,
          "the to address should be receiver"
        );
        assert.equal(log.args.value, amount, "the value amount should be 100");
      });
    });

    // NEED TO REVISIT THIS, video 24:15: DelegatedToken Transfers
    // The try catch block is not correct nor are the tests
    describe("failed 'transferFrom()' transactions", () => {
      it("rejects insufficient allowance amounts", async () => {
        let invalidAmount;
        invalidAmount = 1000000000000;
        let result;

        try {
          await ticket.transferFrom(deployer, receiver, invalidAmount, {
            from: exchange,
          });
        } catch (error) {
          //console.log("Error: ", error.message);

          assert.equal(
            error.message,
            "Returned error: VM Exception while processing transaction: revert",
            "properly stopped execution"
          );
        }
      });

      it("rejects invalid address", async () => {
        let invalidAddress = 0x0;

        try {
          await ticket.transfer(invalidAddress, amount, { from: deployer });
          console.log("Address is VALID");
        } catch (error) {
          //console.log("Error.message: ", error.message);

          assert.equal(
            error.message,
            'invalid address (arg="_to", coderType="address", value=0)',
            "should reject invalid address"
          );
        }
      });
    });
  });
});
