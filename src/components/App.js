import React, { Component, Fragment } from "react";
import getWeb3 from "./getWeb3";
//import Token from "../abis/Token.json";
import Factory from "../abis/EventTicketingFactory.json";
import GAEventTicket from "../abis/GAEventTickets.json";

//import Header from "./Headers/Header";

import Logo from "../blu_mun.jpeg";
//import Logo from "../blu_mun_alt.jpg";

import "./App.css";

import classes from "./EventTombstone.module.css";
import { truncate } from "lodash";

class App extends Component {
  state = {
    isLoading: true,
    display: "all", // events, create, myEvents, myTickets, exchange3
    web3: null,
    accounts: null,
    networkId: null,
    factory: null,
    factoryAddress: null,
    mananger: null,
    gaTicketWarnings: {
      nameRemaining: false,
      name: "true",
      symbolRemaining: false,
      symbol: "true",
      initialRemaining: false,
      initial: "true",
      priceRemaining: false,
      price: "true",
    },
    gaTicketDetails: [
      //{
      //address: null,
      //name: null,
      //symbol: null,
      //ticketSupply: null,
      //primaryPrice: null,
      //available: null,
      //creator: null,
      //newOrder: [{ number: null, amount: null }],
      //},
    ],
    newEvent: { name: "", symbol: "", initial: "", price: "" },
    myEvents: [],
    myTickets: [],
  };

  componentDidMount = async () => {
    await this.detectAccountChange();
    try {
      // creates instance of "Web3" by calling "getWeb3"
      const web3 = await getWeb3();
      this.setState({ web3: web3 });
      console.log("web3 version: ", this.state.web3.version);

      // uses "web3" instance to get user accounts associated with given provider
      const accounts = await web3.eth.getAccounts();
      this.setState({ accounts: accounts });
      console.log("Accounts: ", this.state.accounts);

      // function from "web3.eth.net" library that gets current network ID
      // for example, Rinkeby is networkId "4" and ganache-gui is "5777"
      // used to determine "deployedNetwork" and "factoryAddress"
      const networkId = await web3.eth.net.getId();
      this.setState({ networkId: networkId });
      console.log("networkId: ", this.state.networkId);

      // function from "web3.eth.net" library that gets current network
      const network = await web3.eth.net.getNetworkType();
      console.log("network: ", network);

      // extracts "networkId" field inside "networks" field inside ".json" file
      // remember "Factory = EventTicketingFactory.json"
      // for example, this equates to "EventTicketingFactory.json.networks[4]" or "EventTicketingFactory.json.networks[5777]"
      const deployedNetwork = Factory.networks[networkId];
      console.log("Deployed Network: ", deployedNetwork);

      const factoryAddress = Factory.networks[networkId].address;
      this.setState({ factoryAddress: factoryAddress });
      console.log("Factory address ", this.state.factoryAddress);

      // creates an instance of contract defined by its ABI and address
      // "new web3.eth.Contracts(abi, address)"
      // "abi" is located in root level of "EventTicketingFactory.json"
      // address is located in "address" field inside "networks[4]" or "networkd[5777]"
      const factory = new web3.eth.Contract(
        Factory.abi,
        deployedNetwork && deployedNetwork.address
      );
      this.setState({ factory: factory });
      console.log("Factory contract ", this.state.factory);

      // extract the Factory contract manager
      const manager = await factory.methods.manager().call();
      this.setState({ manager: manager });
      console.log("Factory manager ", this.state.manager);

      this.retrieveEventData();
    } catch (err) {}
  };

  retrieveEventData = async () => {
    const { factory, web3 } = this.state;

    this.setState({ gaTicketDetails: [], myEvents: [], myTickets: [] });
    // retrieves list of launched GATicket events
    const gaTickets = await factory.methods.getDeployedGAEventTickets().call();
    console.log("gaTickets: ", gaTickets);
    if (gaTickets.length === 0) {
      this.setState({ isLoading: false });
    } else {
      let tempArray1 = [];
      let tempArray2 = [];
      let tempArray3 = [];

      // extracts specific data from each launched event
      gaTickets.map(async (item, index) => {
        const gaEvent = new web3.eth.Contract(GAEventTicket.abi, item);
        const address = gaEvent._address;
        let name = await gaEvent.methods.name().call();
        let symbol = await gaEvent.methods.symbol().call();
        let ticketSupply = await gaEvent.methods.totalSupply().call();
        let primaryPrice = await gaEvent.methods.primaryPrice().call();
        let creator = await gaEvent.methods.creator().call();
        let available = await gaEvent.methods.balanceOf(creator).call();

        let purchased = await gaEvent.methods
          .balanceOf(this.state.accounts[0])
          .call();

        let tempObject1 = {
          address: item,
          name: name,
          symbol: symbol,
          ticketSupply: ticketSupply,
          primaryPrice: primaryPrice,
          available: available,
          creator: creator,
          newOrder: [{ number: null, amount: null }],
        };

        //console.log("new event: ", tempObject1);
        //console.log("gaTicketDetails: ", this.state.gaTicketDetails);

        tempArray1.push(tempObject1);
        this.setState({ gaTicketDetails: tempArray1 });

        if (creator === this.state.accounts[0]) {
          let tempAddress = item;

          tempArray2.push(tempAddress);
          this.setState({ myEvents: tempArray2 });
        } else if (purchased > 0) {
          //console.log("I bought tickets to this event");
          let tempPurchase = {
            name: name,
            symbol: symbol,
            address: address,
            amount: purchased,
          };

          tempArray3.push(tempPurchase);
          this.setState({ myTickets: tempArray3 });
        } else {
          //console.log("I did not create or buy tickets to this event");
        }

        //console.log("MY EVENTS: ", this.state.myEvents);

        if (index === gaTickets.length - 1) {
          this.setState({ isLoading: false });
        }
      });
    }
  };

  eventList = () => {
    const { isLoading, web3, accounts, gaTicketDetails } = this.state;

    if (isLoading) {
      return <div>Loading information...</div>;
    } else if (!(gaTicketDetails.length === 0)) {
      return (
        <Fragment>
          {gaTicketDetails.map((item, index) => {
            let contains = false;
            if (this.state.myEvents.includes(item.address)) {
              contains = true;
            }
            //console.log("item: ", item);
            return (
              <article className={classes.Event}>
                <div
                  className={classes.EventTitle}
                  style={{ fontSize: "24px" }}
                >
                  {`${item.name} (symbol: ${item.symbol})`}
                </div>
                <div>Ticket Symbol: {item.symbol}</div>
                <div>Initial Ticket Amount: {item.ticketSupply}</div>
                <div>Current Availability: {item.available}</div>
                <div>Ticket Price: {item.primaryPrice} wei</div>
                <div>Ticket Address: {item.address}</div>
                <div>Event Creator: {item.creator}</div>
                {contains ? (
                  <div>
                    {" "}
                    <button>Manage your event</button>
                  </div>
                ) : (
                  <div>
                    <input
                      style={{ width: "300px" }}
                      name="name"
                      placeholder="limit 64 alphanumeric characters"
                      value={this.state.gaTicketDetails[index].newOrder.number}
                      onChange={(event) => {
                        let tempState = [...this.state.gaTicketDetails];
                        tempState[index].newOrder.number = event.target.value;
                        tempState[index].newOrder.amount =
                          event.target.value *
                          this.state.gaTicketDetails[index].primaryPrice;
                        console.log("tempState[index]: ", tempState[index]);
                        console.log(
                          "tempState[index].newOrder: ",
                          tempState[index].newOrder
                        );
                        console.log("tempState: ", tempState);

                        this.setState({ gaTicketDetails: tempState });
                      }}
                    ></input>

                    <button
                      onClick={async () => {
                        const gaEvent = new web3.eth.Contract(
                          GAEventTicket.abi,
                          item.address
                        );

                        let ticketSupply = await gaEvent.methods
                          .totalSupply()
                          .call();

                        let available = await gaEvent.methods
                          .balanceOf(item.creator)
                          .call();

                        let value = gaTicketDetails[index].newOrder.amount;
                        let quantity = gaTicketDetails[index].newOrder.number;

                        const result1 = await gaEvent.methods
                          .primaryTransfer(quantity)
                          .send({ from: accounts[0], value: value + 9 });

                        const result2 = await gaEvent.methods
                          .balanceOf(gaTicketDetails[index].creator)
                          .call();

                        let tempState = [...this.state.gaTicketDetails];

                        tempState[index].available = result2;

                        this.setState({ gaTicketDetails: tempState });
                      }}
                    >
                      Buy tickets
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </Fragment>
      );
    } else {
      return <div>There are no events available</div>;
    }
  };

  detectAccountChange() {
    const ethereum = window.ethereum;

    if (ethereum) {
      ethereum.on("accountsChanged", function (accounts) {
        console.log(accounts[0]);
        // this.setState({ loading: false})
        window.location.reload();
      });
    }
  }

  myEventList = () => {
    const { gaTicketDetails, myEvents } = this.state;
    if (this.state.isLoading) {
      return <div>Loading information...</div>;
    } else if (!(myEvents.length === 0)) {
      return (
        <Fragment>
          {gaTicketDetails.map((item, index) => {
            let match = false;
            myEvents.map((item2, index) => {
              if (item2 === item.address) {
                match = true;
              }
            });
            //if (item.address in myEvents) {
            if (match) {
              return (
                <article className={classes.Event}>
                  <div
                    className={classes.EventTitle}
                    style={{ fontSize: "24px" }}
                  >
                    {`${gaTicketDetails[index].name} (symbol: ${gaTicketDetails[index].symbol})`}
                  </div>
                  <div>Ticket Symbol: {item.symbol}</div>
                  <div>Initial Ticket Amount: {item.ticketSupply}</div>
                  <div>Current Availability: {item.available}</div>
                  <div>Ticket Price: {item.primaryPrice} wei</div>
                  <div>Ticket Address: {item.address}</div>
                  <div>Event Creator: {item.creator}</div>
                </article>
              );
            }
          })}
        </Fragment>
      );
    } else {
      return <div>You have not created any active events</div>;
    }
  };

  myTicketsList = () => {
    const { myTickets } = this.state;
    if (this.state.isLoading) {
      return <div>Loading...</div>;
    } else if (!(myTickets.length === 0)) {
      return (
        <Fragment>
          {myTickets.map((item, index) => {
            return (
              <article className={classes.Event}>
                <div
                  className={classes.EventTitle}
                  style={{ fontSize: "24px" }}
                >
                  {`${item.name} (symbol: ${item.symbol})`}
                </div>
                <div
                  className={classes.EventTitle}
                  style={{ fontSize: "24px" }}
                >
                  {`address: ${item.address}, amount: ${item.amount})`}
                </div>
              </article>
            );
          })}
        </Fragment>
      );
    } else {
      return <div>You do not have any active tickets</div>;
    }
  };

  onClick = async () => {
    const { factory, web3 } = this.state;
    const { name, symbol, initial, price } = this.state.newEvent;

    // use "web3" instance to get user accounts associated with given provider
    const accounts = await web3.eth.getAccounts();
    this.setState({ accounts: accounts });
    console.log("Accounts: ", this.state.accounts);

    // launches a GATicket event
    const result1 = await factory.methods
      .createGATickets(name, symbol, initial, price)
      .send({ from: accounts[0] });

    this.setState({
      newEvent: { name: "", symbol: "", initial: "", price: "" },
      gaTicketWarnings: {
        nameRemaining: false,
        name: "true",
        symbolRemaining: false,
        symbol: "true",
        initialRemaining: false,
        initial: "true",
        priceRemaining: false,
        price: "true",
      },
    });

    // updates gaTicketDetails
    this.retrieveEventData();
  };

  updateNewEvent = (event) => {
    let newEvent = { ...this.state.newEvent };
    newEvent[event.target.name] = event.target.value;
    this.setState({ newEvent: newEvent });
  };

  updateGaWarnings = (event) => {
    let symbolRegex1 = /^[a-zA-Z0-9]{0,6}$/;
    let symbolRegex2 = /^[a-zA-Z0-9]{3,6}$/;
    let initialRegex = /^[1,2,3,4,5,6,7,8,9][0-9]{0,5}$/;
    let priceRegex = /^[1,2,3,4,5,6,7,8,9][0-9]{0,18}$/;

    let name = event.target.name;
    let value = event.target.value;
    let test = true;

    let tempWarnings = { ...this.state.gaTicketWarnings };

    if (name === "name") {
      if (value.length === 0) {
        tempWarnings.name = "true";
      } else {
        tempWarnings.name = "";
      }
    } else if (name === "symbol") {
      test = symbolRegex2.test(value);
      if (value.length === 0) {
        tempWarnings.symbol = "true";
      } else if (!test) {
        test = symbolRegex1.test(value);
        if (!test) {
          tempWarnings.symbol = "can only contain letters and numbers";
        } else {
          tempWarnings.symbol = "minimum 3 characters required";
        }
      } else {
        tempWarnings.symbol = "";
      }
    } else if (name === "initial") {
      test = initialRegex.test(value);
      if (value.length === 0) {
        tempWarnings.initial = "true";
      } else if (!test) {
        tempWarnings.initial = "not a valid number";
      } else if (value > 100000) {
        tempWarnings.initial = "maximum amount is 100,000";
      } else {
        tempWarnings.initial = "";
      }
    } else if (name === "price") {
      test = priceRegex.test(value);
      if (value.length === 0) {
        tempWarnings.price = "true";
      } else if (!test) {
        tempWarnings.price = "not a valid number";
      } else if (value > 1000000000000000000) {
        tempWarnings.price = "maximum amount is 1,000,000,000,000,000,000 wei";
      } else {
        tempWarnings.price = "";
      }
    }
    this.setState({ gaTicketWarnings: tempWarnings });
  };

  warningMessage = (message) => {
    return (
      <div
        style={{
          paddingLeft: "10px",
          height: "14px",
          fontSize: "12px",
          color: "red",
          fontWeight: "700",
        }}
      >
        {message}
      </div>
    );
  };

  remainingMessage = (limit, warning, variable) => {
    if (variable && variable.length >= limit) {
      return (
        <div
          style={{
            paddingLeft: "10px",
            height: "14px",
            fontSize: "12px",
            color: "red",
            fontWeight: "700",
          }}
        >
          Maximum characters used
        </div>
      );
    } else if (variable && variable.length >= limit - warning) {
      return (
        <div
          style={{
            paddingLeft: "10px",
            height: "14px",
            fontSize: "12px",
            color: "red",
          }}
        >
          Remaining characters allowed: {limit - variable.length}
        </div>
      );
    } else if (variable) {
      return (
        <div
          style={{
            paddingLeft: "10px",
            height: "14px",
            fontSize: "12px",
            color: "black",
          }}
        >
          Remaining characters allowed: {limit - variable.length}
        </div>
      );
    } else {
      return (
        <div
          style={{
            paddingLeft: "10px",
            height: "14px",
            fontSize: "12px",
            color: "black",
          }}
        >
          Remaining characters allowed: {limit}
        </div>
      );
    }
  };

  disableButton = () => {
    if (
      this.state.gaTicketWarnings.name ||
      this.state.gaTicketWarnings.symbol ||
      this.state.gaTicketWarnings.initial ||
      this.state.gaTicketWarnings.price
    ) {
      return true;
    } else {
      return false;
    }
  };

  createGATickets = () => {
    return (
      <div
        style={{
          paddingTop: "30px",
          paddingBottom: "20px",
          paddingLeft: "40px",
        }}
      >
        <div
          style={{
            paddingBottom: "10px",
            fontSize: "26px",
            fontWeight: "600",
          }}
        >
          General Admission Tickets
        </div>
        <div>
          <div
            style={{
              padding: "10px 10px 0px 0px",
              height: "30px",
              fontSize: "15px",
              fontWeight: "600",
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          >
            Event Title<span style={{ color: "red" }}>*</span>
          </div>
          <div
            style={{
              height: "auto",
              fontSize: "16px",
              padding: "5px 10px 10px 0px",
              boxSizing: "border-box",
              borderColor: "red",
              backgroundColor: "#fff",
            }}
          >
            <input
              className={
                this.state.gaTicketWarnings.name
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
              style={{ width: "600px" }}
              onFocus={() => {
                let tempWarnings = { ...this.state.gaTicketWarnings };
                tempWarnings.nameRemaining = true;
                this.setState({ gaTicketWarnings: tempWarnings });
              }}
              onBlur={() => {
                let tempWarnings = { ...this.state.gaTicketWarnings };
                tempWarnings.nameRemaining = false;
                this.setState({ gaTicketWarnings: tempWarnings });
              }}
              style={{ width: "500px" }}
              type="text"
              maxLength="64"
              placeholder="limit 64 alphanumeric characters"
              name="name"
              value={this.state.newEvent.name}
              onChange={(event) => {
                this.updateNewEvent(event);
                this.updateGaWarnings(event);
              }}
            ></input>

            {this.state.gaTicketWarnings.nameRemaining
              ? this.remainingMessage(64, 10, this.state.newEvent.name)
              : null}
          </div>
        </div>
        <div>
          <div
            style={{
              padding: "10px 10px 0px 0px",
              height: "30px",
              fontSize: "15px",
              fontWeight: "600",
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          >
            Ticket Symbol<span style={{ color: "red" }}>*</span>
          </div>
          <div
            style={{
              height: "auto",
              fontSize: "16px",
              padding: "5px 10px 10px 0px",
              boxSizing: "border-box",
              borderColor: "red",
              backgroundColor: "#fff",
            }}
          >
            <input
              className={
                this.state.gaTicketWarnings.symbol
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
              style={{ width: "600px" }}
              onFocus={() => {
                let tempWarnings = { ...this.state.gaTicketWarnings };
                tempWarnings.symbolRemaining = true;
                this.setState({ gaTicketWarnings: tempWarnings });
              }}
              onBlur={() => {
                let tempWarnings = { ...this.state.gaTicketWarnings };
                tempWarnings.symbolRemaining = false;
                this.setState({ gaTicketWarnings: tempWarnings });
              }}
              style={{ width: "500px" }}
              type="text"
              maxLength="6"
              placeholder="3 to 6 alphanumeric characters"
              name="symbol"
              value={this.state.newEvent.symbol}
              onChange={(event) => {
                this.updateNewEvent(event);
                this.updateGaWarnings(event);
              }}
            ></input>

            <div>
              {this.state.gaTicketWarnings.symbol &&
              this.state.gaTicketWarnings.symbol !== "true"
                ? this.warningMessage(this.state.gaTicketWarnings.symbol)
                : this.state.gaTicketWarnings.symbolRemaining
                ? this.remainingMessage(6, 3, this.state.newEvent.symbol)
                : null}
            </div>
          </div>
        </div>
        <div>
          <div
            style={{
              padding: "10px 10px 0px 0px",
              height: "30px",
              fontSize: "15px",
              fontWeight: "600",
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          >
            # of Tickets<span style={{ color: "red" }}>*</span>
          </div>
          <div
            style={{
              height: "auto",
              fontSize: "16px",
              padding: "5px 10px 10px 0px",
              boxSizing: "border-box",
              borderColor: "red",
              backgroundColor: "#fff",
            }}
          >
            <input
              className={
                this.state.gaTicketWarnings.initial
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
              style={{ width: "600px" }}
              onFocus={() => {
                let tempWarnings = { ...this.state.gaTicketWarnings };
                tempWarnings.initialRemaining = true;
                this.setState({ gaTicketWarnings: tempWarnings });
              }}
              onBlur={() => {
                let tempWarnings = { ...this.state.gaTicketWarnings };
                tempWarnings.initialRemaining = false;
                this.setState({ gaTicketWarnings: tempWarnings });
              }}
              style={{ width: "500px" }}
              type="text"
              maxLength="6"
              placeholder="max 100,000 tickets"
              name="initial"
              value={this.state.newEvent.initial}
              onChange={(event) => {
                this.updateNewEvent(event);
                this.updateGaWarnings(event);
              }}
            ></input>
            <div>
              {this.state.gaTicketWarnings.initial &&
              this.state.gaTicketWarnings.initial !== "true"
                ? this.warningMessage(this.state.gaTicketWarnings.initial)
                : this.state.gaTicketWarnings.initialRemaining
                ? this.remainingMessage(6, 3, this.state.newEvent.initial)
                : null}
            </div>
          </div>
        </div>
        <div>
          <div
            style={{
              padding: "10px 10px 0px 0px",
              height: "30px",
              fontSize: "15px",
              fontWeight: "600",
              backgroundColor: "#fff",
              boxSizing: "border-box",
            }}
          >
            Ticket Price (in Wei)<span style={{ color: "red" }}>*</span>
          </div>
          <div
            style={{
              height: "auto",
              fontSize: "16px",
              padding: "5px 10px 10px 0px",
              boxSizing: "border-box",
              borderColor: "red",
              backgroundColor: "#fff",
            }}
          >
            <input
              className={
                this.state.gaTicketWarnings.price
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
              style={{ width: "600px" }}
              onFocus={() => {
                let tempWarnings = { ...this.state.gaTicketWarnings };
                tempWarnings.priceRemaining = true;
                this.setState({ gaTicketWarnings: tempWarnings });
              }}
              onBlur={() => {
                let tempWarnings = { ...this.state.gaTicketWarnings };
                tempWarnings.priceRemaining = false;
                this.setState({ gaTicketWarnings: tempWarnings });
              }}
              style={{ width: "500px" }}
              type="text"
              maxLength="19"
              placeholder="max 1,000,000,000,000,000,000 wei"
              name="price"
              value={this.state.newEvent.price}
              onChange={(event) => {
                this.updateNewEvent(event);
                this.updateGaWarnings(event);
              }}
            ></input>
            <div>
              <div>
                {this.state.gaTicketWarnings.price &&
                this.state.gaTicketWarnings.price !== "true"
                  ? this.warningMessage(this.state.gaTicketWarnings.price)
                  : this.state.gaTicketWarnings.priceRemaining
                  ? this.remainingMessage(19, 6, this.state.newEvent.price)
                  : null}
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: "20px", paddingLeft: "100px" }}>
          <button
            className={
              this.disableButton()
                ? classes.ButtonGreenOpac
                : classes.ButtonGreen
            }
            disabled={this.disableButton()}
            onClick={this.onClick}
          >
            Create General Admission Tickets
          </button>
        </div>
      </div>
    );
  };

  createASTickets = () => {
    return (
      <div
        style={{
          paddingTop: "30px",
          paddingBottom: "20px",
          paddingLeft: "40px",
        }}
      >
        <div
          style={{
            paddingBottom: "10px",
            fontSize: "26px",
            fontWeight: "600",
          }}
        >
          Assigned Seating Tickets
          <div
            style={{ paddingTop: "20px", paddingLeft: "150px", color: "red" }}
          >
            Coming soon!
          </div>
        </div>
      </div>
    );
  };

  ticketExchange = () => {
    return (
      <div
        style={{
          paddingTop: "20px",
          paddingBottom: "20px",
          paddingLeft: "40px",
        }}
      >
        <div
          style={{
            paddingBottom: "10px",
            fontSize: "26px",
            fontWeight: "600",
            color: "red",
          }}
        >
          Coming soon!
        </div>
      </div>
    );
  };

  changeDisplay = (view) => {
    console.log("clicked");
    this.setState({ display: view });
  };

  header = (
    <header
      style={{
        paddingLeft: "10px",
        paddingRight: "10px",
        display: "grid",
        gridTemplateColumns: "80px 400px auto",
        backgroundColor: "#000",
      }}
    >
      <div>
        <img
          className={classes.ImageBox}
          src={Logo}
          alt="No logo available"
          onerror="onerror=null;src='../../assets/Get_Your_Tickets.png'"
          onClick={() => {
            this.changeDisplay("all");
          }}
        />
      </div>
      <div
        style={{
          paddingTop: "15px",
          listStyleType: "none",
          fontSize: "30px",
          fontWeight: "600",
          color: "#4792F7", //#76AFF9
        }}
      >
        Blü Mün Crypto Tickets
      </div>
      <div
        style={{
          textAlign: "center",
        }}
      >
        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "70px 120px 100px 140px 140px",
          }}
        >
          <li
            style={{
              paddingTop: "30px",
              listStyleType: "none",
              color: "#F0AE00",
            }}
            onClick={() => {
              this.changeDisplay("events");
            }}
          >
            Events
          </li>
          <li
            style={{
              paddingTop: "30px",
              listStyleType: "none",
              color: "#F0AE00",
            }}
            onClick={() => {
              this.changeDisplay("create");
            }}
          >
            Issue Tickets
          </li>
          <li
            style={{
              paddingTop: "30px",
              listStyleType: "none",
              color: "#F0AE00",
            }}
            onClick={() => {
              this.changeDisplay("myEvents");
            }}
          >
            My Events
          </li>
          <li
            style={{
              paddingTop: "30px",
              listStyleType: "none",
              color: "#F0AE00",
            }}
            onClick={() => {
              this.changeDisplay("myTickets");
            }}
          >
            My Ticket Wallet
          </li>
          <li
            style={{
              paddingTop: "30px",
              listStyleType: "none",
              color: "#F0AE00",
            }}
            onClick={() => {
              this.changeDisplay("exchange");
            }}
          >
            Ticket Exchange
          </li>
        </ul>
      </div>
    </header>
  );

  accountHeader = () => {
    if (this.state.isLoading) {
      return (
        <div
          style={{ paddingTop: "30px", textAlign: "center", fontSize: "26px" }}
        >
          Who are you?
        </div>
      );
    } else {
      return (
        <div
          style={{ paddingTop: "30px", textAlign: "center", fontSize: "26px" }}
        >
          Hello account: {this.state.accounts[0]}
        </div>
      );
    }
  };

  render() {
    return (
      <div>
        {this.header}
        <div>{this.accountHeader()}</div>
        <div
          style={{
            paddingTop: "30px",
            paddingLeft: "85px",
            backgroundColor: "#fff",
          }}
        >
          {this.state.display === "create" || this.state.display === "all" ? (
            <div style={{ paddingBottom: "30px" }}>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: "700",
                  textDecoration: "underline",
                }}
              >
                Issue Tickets
              </div>
              <div>{this.createGATickets()}</div>
              <div>{this.createASTickets()}</div>
            </div>
          ) : null}

          {this.state.display === "events" || this.state.display === "all" ? (
            <div style={{ paddingTop: "20px" }}>
              <div style={{ fontSize: "26px", fontWeight: "600" }}>Events</div>
              <div>{this.eventList()}</div>
            </div>
          ) : null}

          {this.state.display === "myEvents" || this.state.display === "all" ? (
            <div style={{ paddingTop: "20px" }}>
              <div style={{ fontSize: "26px", fontWeight: "600" }}>
                My Events
              </div>
              <div>{this.myEventList()}</div>
            </div>
          ) : null}

          {this.state.display === "myTickets" ||
          this.state.display === "all" ? (
            <div style={{ paddingTop: "20px" }}>
              <div style={{ fontSize: "26px", fontWeight: "600" }}>
                My Ticket Wallet
              </div>
              <div>{this.myTicketsList()}</div>
            </div>
          ) : null}

          {this.state.display === "exchange" || this.state.display === "all" ? (
            <div style={{ paddingBottom: "30px" }}>
              <div
                style={{
                  fontSize: "30px",
                  fontWeight: "700",
                  textDecoration: "underline",
                }}
              >
                Ticket Exchange
              </div>
              <div>{this.ticketExchange()}</div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

export default App;

/*
async loadBlockchainData() {
  // Get network provider and web3 instance.
  const web3 = await getWeb3(); //dup
  console.log("web3: ", web3); //dup

  // function from "web3.eth.net" library that gets current network ID
  const networkId = await web3.eth.net.getId(); //dup
  console.log("networkId: ", networkId); //dup

  // function from "web3.eth.net" library that gets current network ID
  const network = await web3.eth.net.getNetworkType(); //dup
  console.log("network: ", network); //dup

  const accounts = await web3.eth.getAccounts(); //dup
  console.log("accounts: ", accounts); //dup

  console.log("Token: ", Token); //dup
  console.log("Token abi: ", Token.abi); //dup
  console.log("Token address: ", Token.networks[networkId].address); //dup
  const address1 = Token.networks[networkId].address; //dup
  console.log("Token address: ", address1); //dup

  // create an instance of the contract using an instance of Web3
  const token = new web3.eth.Contract(
    Token.abi,
    Token.networks[networkId].address
  );
  console.log("token: ", token);

  const totalSupply = await token.methods.totalSupply().call();
  console.log("Total Supply: ", totalSupply);

  console.log("Factory: ", Factory); //dup
  console.log("Factory abi: ", Factory.abi); //dup
  console.log("Factory address: ", Factory.networks[networkId].address); //dup
  const address2 = Factory.networks[networkId].address; //dup
  console.log("Factory address: ", address2); //dup

  // create an instance of the contract using an instance of Web3
  const factory = new web3.eth.Contract( //dup
    Factory.abi, //dup
    Factory.networks[networkId].address //dup
  );
  console.log("factory: ", factory); //dup

  const owner = await token.methods.owner().call();
  console.log("Owner: ", owner);
}
*/
