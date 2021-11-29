import React, { Component, Fragment } from "react";
import getWeb3 from "./getWeb3";
import Factory from "../abis/EventTicketingFactory.json";
import GAEventTicket from "../abis/GAEventTickets.json";

import Spinner from "./Spinner/Spinner";

import Logo from "./Assets/blu_mun.jpeg";

import classes from "./App.module.css";

class App extends Component {
  state = {
    isLoading: true,
    display: "events", // events, create, myEvents, myTickets, exchange3
    modal: "none", // none, buy, create, modify, transfer
    modalSpinner: false,
    transactionSuccess: "none", // none, success, failure
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
    gaTransferWarnings: {
      recipientRemaining: false,
      recipient: "true",
    },
    newEvent: { name: "", symbol: "", initial: "", price: "" },
    newOrder: {},
    transferOrder: {},
    selectedEvent: [],
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
            creator: creator,
            price: primaryPrice,
            amount: purchased,
          };

          tempArray3.push(tempPurchase);
          this.setState({ myTickets: tempArray3 });
        } else {
          //console.log("I did not create or buy tickets to this event");
        }

        console.log("Hello");
        console.log("MY tickets: ", this.state.myTickets);
        console.log("Goodbye");

        if (index === gaTickets.length - 1) {
          this.setState({ isLoading: false });
        }
      });
    }
  };

  eventButtons = (contains, item, index) => {
    const { web3, gaTicketDetails } = this.state;
    if(contains) {
      return (
        <div style={{paddingTop: "20px", paddingBottom: "10px"}}>
          <button
            className={classes.ButtonBlueSmall}
            onClick={() => {
              this.setState({display: "myEvents"})
            }}
          >MANAGE YOUR EVENT</button>
        </div>
      )
    } else if (item.available === "0") {
      return (
        <div style={{paddingTop: "20px", paddingBottom: "5px", fontSize: "30px", fontWeight: "600", color: "red"}}>
          SOLD OUT
        </div>
      )
    } else {
      return (
        <div style={{paddingTop: "20px", paddingBottom: "10px"}}>
          <button
            className={classes.ButtonGreenSmall}
            onClick={async () => {
              const { web3 } = this.state;
              
              const gaEvent = new web3.eth.Contract(
                GAEventTicket.abi,
                item.address)

              let newItem = {...item}
;
              let available = await gaEvent.methods
                .balanceOf(item.creator)
                .call();






              newItem.index = index;
              newItem.available = available;
              newItem.quantity = 0;
              this.setState({modal: "buy", newOrder: newItem})
              console.log("Buy item: ", item)
              console.log("gaTicketDetails: ", gaTicketDetails)
            }}
          >
            BUY TICKETS
          </button>
        </div>          
      )
    }
  }

  eventList = () => {
    const { isLoading, web3, accounts, gaTicketDetails } = this.state;

    if (isLoading) {
      return <div>Loading information...</div>;
    } else if (!(gaTicketDetails.length === 0)) {
      return (
        <Fragment>
          {gaTicketDetails.map((item, index) => {
            console.log("New order: ", this.state.newOrder)
            let contains = false;
            if (this.state.myEvents.includes(item.address)) {
              contains = true;
            }
            return (
              <article className={classes.Event}>
                <div
                  className={classes.EventTitle}
                  style={{ fontSize: "24px" }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "50% 48%",
                    columnGap: "2%"
                  }}>
                  <div style={{textAlign: "right"}}>
                    <div>Ticket Symbol:</div>
                    <div>Tickets Available:</div>
                    <div>Ticket Price:</div>
                  </div>
                  <div style={{textAlign: "left"}}>
                    <div>{item.symbol}</div>
                    <div>{item.available}</div>
                    <div>{item.primaryPrice} wei</div>
                  </div>
                </div>
                
                {this.eventButtons(contains, item, index)}
                <div style={{paddingTop: "10px", fontWeight: "600"}}>Ticket Address</div>
                <div>{item.address}</div>
                <div style={{paddingTop: "10px", fontWeight: "600"}}>Event Creator</div>
                <div>{item.creator}</div>
              </article>
            );
          })}
        </Fragment>
      );
    } else {
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
              fontSize: "26px",
              fontWeight: "600",
              color: "rblack",
            }}
          >
            There are no events available
          </div>
        </div>
      )
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
                  <div>Tickets Availability: {item.available}</div>
                  <div>Ticket Price: {item.primaryPrice} wei</div>
                  <div>Event Creator: {item.creator}</div>
                </article>
              );
            }
          })}
        </Fragment>
      );
    } else {
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
              fontSize: "26px",
              fontWeight: "600",
              color: "rblack",
            }}
          >
            You do not have any active events
          </div>
        </div>
      )
    }
  };

  myTicketsList = () => {
    const { myTickets } = this.state;
    console.log("Transfer order: ", this.state.transferOrder)
    if (this.state.isLoading) {
      return <div>Loading...</div>;
    } else if (!(myTickets.length === 0)) {
      return (
        <Fragment>
          {myTickets.map((item, index) => {
            console.log("item: ", item)
            return (
              <div style={{paddingBottom: "30px"}}>
                <div
                  style={{ fontSize: "24px", fontWeight: "600", paddingBottom: "10px" }}
                >
                  {item.name} ({item.symbol})
                </div>
                <div
                  style={{display: "grid", 
                    gridTemplateColumns: "180px 300px",
                    columnGap: "5px",
                    fontSize: "20px"
                  }}
                >
                  <div style={{textAlign: "right"}}>Ticket address:</div>
                  <div style={{textAlign: "left"}}>{item.address}</div>
                  <div style={{textAlign: "right"}}>Event creator:</div>
                  <div style={{textAlign: "left"}}>{item.creator}</div>
                  <div style={{textAlign: "right"}}>Tickets owned:</div>
                  <div style={{textAlign: "left"}}>{item.amount}</div>
                </div>
                <div style={{paddingLeft: "160px", paddingTop: "20px", paddingBottom: "30px"}}>
                  <button
                    className={classes.ButtonBlueSmall}

                    onClick={() => {
                      let newItem = {...item}

                      newItem.transferring = 0;
                      newItem.recipient = "";
                      console.log("item: ", item)
                      console.log("newItem: ", newItem)
                      this.setState({modal: "transfer", transferOrder: newItem})
                      console.log("transfer Order: ", this.state.transferOrder)
                      console.log("Transfer order: ", this.state.transferOrder)
                    }}
                  >TRANSFER TICKETS</button>
                </div>
                <hr style={{width: "100%", backgroundColor: "#666"}}/>
              </div>
            );
          })}
        </Fragment>
      );
    } else {
      
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
              fontSize: "26px",
              fontWeight: "600",
              color: "rblack",
            }}
          >
            You do not have any active tickets
          </div>
        </div>
      )
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

  
  updateTransferOrder = (event) => {
    let newOrder = { ...this.state.transferOrder };
    newOrder[event.target.name] = event.target.value;
    this.setState({ transferOrder: newOrder });
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
      <div className={classes.TicketCreationPane}>
        <div className={classes.TicketCreationTitle}>
          General Admission Tickets
        </div>
        <div>
          <div className={classes.InputBoxLabel}>
            Event Title<span style={{ color: "red" }}>*</span>
          </div>
          <div className={classes.InputBox}>
            <input
              className={
                this.state.gaTicketWarnings.name
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
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
          <div className={classes.InputBoxLabel}>
            Ticket Symbol<span style={{ color: "red" }}>*</span>
          </div>
          <div className={classes.InputBox}>
            <input
              className={
                this.state.gaTicketWarnings.symbol
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
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
            {this.state.gaTicketWarnings.symbol &&
              this.state.gaTicketWarnings.symbol !== "true"
              ? this.warningMessage(this.state.gaTicketWarnings.symbol)
              : this.state.gaTicketWarnings.symbolRemaining
              ? this.remainingMessage(6, 3, this.state.newEvent.symbol)
              : null}
          </div>
        </div>
        <div>
          <div className={classes.InputBoxLabel}>
            # of Tickets<span style={{ color: "red" }}>*</span>
          </div>
          <div className={classes.InputBox}>
            <input
              className={
                this.state.gaTicketWarnings.initial
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
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
            {this.state.gaTicketWarnings.initial &&
              this.state.gaTicketWarnings.initial !== "true"
              ? this.warningMessage(this.state.gaTicketWarnings.initial)
              : this.state.gaTicketWarnings.initialRemaining
              ? this.remainingMessage(6, 3, this.state.newEvent.initial)
              : null}
          </div>
        </div>
        <div>
          <div className={classes.InputBoxLabel}>
            Ticket Price (in Wei)<span style={{ color: "red" }}>*</span>
          </div>
          <div className={classes.InputBox}>
            <input
              className={
                this.state.gaTicketWarnings.price
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
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
              {this.state.gaTicketWarnings.price &&
                this.state.gaTicketWarnings.price !== "true"
                ? this.warningMessage(this.state.gaTicketWarnings.price)
                : this.state.gaTicketWarnings.priceRemaining
                ? this.remainingMessage(19, 6, this.state.newEvent.price)
                : null}
            </div>
          </div>
        </div>
        <div style={{ paddingTop: "20px"}}>
          <button
            className={
              this.disableButton()
                ? classes.ButtonGreenOpac
                : classes.ButtonGreen
            }
            disabled={this.disableButton()}
            onClick={this.onClick}
          >
            CREATE GENERAL ADMISSION TICKETS
          </button>
        </div>
      </div>
    );
  };

  createASTickets = () => {
    return (
      <div className={classes.TicketCreationPane}>
        <div className={classes.TicketCreationTitle}>
          Assigned Seating Tickets
          <div
            style={{ paddingTop: "20px", paddingLeft: "40px", color: "red" }}
          >
            Coming soon!
          </div>
        </div>
      </div>
    );
  };

  createEventNFTs = () => {
    return (
      <div className={classes.TicketCreationPane}>
        <div className={classes.TicketCreationTitle}>
          Event NFTs
          <div
            style={{ paddingTop: "20px", paddingLeft: "40px", color: "red" }}
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
            color: "red",
          }}
        >
          Coming soon!
        </div>
      </div>
    );
  };

  changeDisplay = (view) => {
    this.setState({ display: view });
  };

  header = (
    <header
      style={{
        paddingLeft: "20px",
        paddingRight: "60px",
        height: "80px",
        width: "100%",
        boxSizing: "border-box",
        zIndex: "200",
        display: "grid",
        gridTemplateColumns: "80px 400px auto",
        backgroundColor: "#000",
        position: "fixed",
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
          paddingTop: "10px",
          listStyleType: "none",
          fontSize: "36px",
          fontWeight: "600",
          color: "#4792F7", //#76AFF9
        }}
      >
        Blü Mün Event Tickets
      </div>
      <div
        style={{
          textAlign: "center",
        }}
      >
        <ul
          style={{
            display: "grid",
            gridTemplateColumns: "auto 100px 120px 110px 160px 160px",
            columnGap: "20px",
          }}
        >
          <li></li>
          <li
            className={classes.HeaderItem}
            onClick={() => {
              console.log("display: ", this.state.display)
              this.changeDisplay("events");
            }}
          >
            All Events
          </li>
          <li
            className={classes.HeaderItem}
            onClick={() => {
              this.changeDisplay("create");
            }}
          >
            Issue Tickets
          </li>
          <li
            className={classes.HeaderItem}
            onClick={() => {
              this.changeDisplay("myEvents");
            }}
          >
            My Events
          </li>
          <li
            className={classes.HeaderItem}
            onClick={() => {
              this.changeDisplay("myTickets");
            }}
          >
            My Ticket Wallet
          </li>
          <li
            className={classes.HeaderItem}
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
        <div className={classes.AccountHeader}>
          Who are you?
        </div>
      );
    } else {
      return (
        <div className={classes.AccountHeader}>
          Hello account: {this.state.accounts[0]}
        </div>
      );
    }
  };

  issueTicketsDisplay = () => {
    if(this.state.display === "create" || this.state.display === "all") {
      return (
        <div className={classes.PageDisplay}>
          <div className={classes.PageTitle}>
            Issue Tickets
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "700px 700px 700px",
              columnGap: "20px"
            }}
          >
            <div>{this.createGATickets()}</div>
            <div>{this.createASTickets()}</div>
            <div>{this.createEventNFTs()}</div>
          </div>
        </div>
      )
    } else return null
  }

  eventsDisplay = () => {
    if(this.state.display === "events" || this.state.display === "all") {
      return (
        <div className={classes.PageDisplay}>
          <div className={classes.PageTitle}>
            All Events
          </div>
          <div
            style={{
              paddingTop: "30px",
              paddingRight: "40px",
              paddingBottom: "30px", 
              paddingLeft: "40px"
            }}
          >
            <section className={classes.Events}>
              {this.eventList()}
            </section>
          </div>
        </div>
      )
    } else return null
  }

  exchangeDisplay = () => {
    if(this.state.display === "exchange" || this.state.display === "all") {
      return (
        <div className={classes.PageDisplay}>
          <div className={classes.PageTitle}>
            Ticket Exchange
          </div>
          <div>{this.ticketExchange()}</div>
        </div>
      )
    } else return null
  }

  myTicketsDisplay = () => {
    if(this.state.display === "myTickets" || this.state.display === "all") {
      return (
        <div className={classes.PageDisplay}>
          <div className={classes.PageTitle}>
            My Ticket Wallet
          </div>
          <div
            style={{
              width: "800px",
              paddingTop: "30px",
              paddingRight: "40px",
              paddingBottom: "30px", 
              paddingLeft: "40px"
            }}>{this.myTicketsList()}</div>
        </div>
      )
    } else return null
  }

  transferModalBody = () => {
    const { web3, accounts, gaTicketDetails, transferOrder } = this.state;
      const gaEvent = new web3.eth.Contract(
        GAEventTicket.abi,
        transferOrder.address
      );
    
    let ticketsArray = [0]
    for (let i = 1; i <= transferOrder.amount; i++) {
      ticketsArray.push(i);
    }
    
    if(this.state.modalSpinner) {
     return (
        <Fragment>
          <div style={{fontSize: "24px", paddingTop: "60px"}}>Your tickets are being transferred</div>
          <div style={{height: "80px", paddingTop: "10px"}}><Spinner/></div>
          <div style={{fontSize: "24px", paddingTop: "100px"}}>This can take up to 30 seconds</div>
        </Fragment>
      )
    } else if (this.state.transactionSuccess === "none") {
            return (
        <Fragment>
          <div style={{fontSize: "34px"}}>Ticket Transfer</div>
          <div style={{fontSize: "24px"}}>{transferOrder.name}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "50% 48%",
              columnGap: "2%"
            }}>
              <div style={{textAlign: "right"}}>
                <div style={{fontSize: "18px"}}>Ticket Symbol:</div>
                <div style={{fontSize: "18px"}}>Tickets Owned:</div>
                <div style={{fontSize: "18px"}}>Ticket Price:</div>
              </div>
              <div style={{textAlign: "left"}}>
            <div style={{fontSize: "18px"}}>{transferOrder.symbol}</div>
            <div style={{fontSize: "18px"}}>{transferOrder.amount}</div>
            <div style={{fontSize: "18px"}}>{transferOrder.price} wei</div>
              </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60% 38%",
              columnGap: "2%",
              paddingTop: "15px"
            }}>
            <div style={{fontSize: "24px", textAlign: "right", paddingTop: "8px"}}># Tickets to Transfer</div>
            <div style={{fontSize: "24px", textAlign: "left"}}>
              <select
                style={{
                  padding: "9px 5px",
                  border: "1px solid lightgrey",
                  boxSizing: "borderBox",
                  width: "105px",
                  lineHeight: "1.75",
                  cursor: "pointer"}}
                type="text"
                id="input box time selection"
                value={transferOrder.transferring}
                name="transferring"
                onChange={(event) => {
                  console.log("Value: ", event.target.value);
                  let tempOrder = {...transferOrder};
                  console.log("Temp Order: ", tempOrder);
                  tempOrder.transferring = event.target.value;
                  console.log("Transferring: ", tempOrder);
                  this.setState({transferOrder: tempOrder})
                }}
                required
              >{ticketsArray.map(number => (<option>{number}</option>))}</select>
            </div>
            
          </div>



        <div>
          <div className={classes.InputBoxLabel}>
            Recipient address<span style={{ color: "red" }}>*</span>
          </div>
          <div className={classes.InputBox}>
            <input
              className={
                this.state.gaTransferWarnings.recipient
                  ? classes.InputBoxContentError
                  : classes.InputBoxContent
              }
              onFocus={() => {
                let tempWarnings = { ...this.state.gaTransferWarnings };
                tempWarnings.recipientRemaining = true;
                this.setState({ gaTransferWarnings: tempWarnings });
              }}
              onBlur={() => {
                let tempWarnings = { ...this.state.gaTransferWarnings };
                tempWarnings.recipientRemaining = false;
                this.setState({ gaTransferWarnings: tempWarnings });
              }}
              type="text"
              maxLength="42"
              placeholder="42 hexadecimal address my starting with 0x"
              name="recipient"
              value={this.state.transferOrder.recipient}
              onChange={(event) => {
                this.updateTransferOrder(event);
                console.log("transfer order: ", this.state.transferOrder)
                //this.updateGaWarnings(event);
              }}
            ></input>
            {this.state.gaTransferWarnings.recipient &&
              this.state.gaTransferWarnings.recipient !== "true"
              ? this.warningMessage(this.state.gaTransferWarnings.recipient)
              : this.state.gaTransferWarnings.recipientRemaining
              ? this.remainingMessage(42, 10, this.state.transferOrder.recipient)
              : null}
          </div>
        </div>

          <div style={{paddingTop: "20px"}}>
            <button
              className={
                parseInt(this.state.transferOrder.transferring) === 0
                  ? classes.ButtonBlueSmallOpac
                  : classes.ButtonBlueSmall
              }
              disabled={parseInt(this.state.transferOrder.transferring) === 0}
              onClick={async () => {
                this.setState({modalSpinner: true});
                let tempOrder = {...this.state.transferOrder};
                console.log("transferOrder: ", this.state.transferOrder.transferring)

                try {
                  await gaEvent.methods
                    //.transfer("0x115d7a7E4Dbc05A825722898FFE331e45e1E2157", this.state.transferOrder.transferring)
                    .transfer(this.state.transferOrder.recipient, this.state.transferOrder.transferring)
                    .send({ from: accounts[0]});
                    this.setState({modalSpinner: false, transactionSuccess: "success"})

                } catch (error) {
                  console.log("Something happened")
                  this.setState({modalSpinner: false, transactionSuccess: "failure"})
                }
              }}
            >EXECUTE TRANSFER</button>
          </div>
          <div style={{paddingTop: "20px"}}>
            <button
              className={classes.ButtonGreySmall}
              onClick={() => {
                this.setState({ transferOrder: {}, modal: "none", modalSpinner: false});
            }}>CANCEL TRANSFER</button>
          </div>
        </Fragment>
      ) 
    } else if (this.state.transactionSuccess === "failure") {
      return (
        <div style={{fontSize: "24px", paddingTop: "80px", paddingBottom: "40px"}}>Your tickets were not transferred
          <div style={{paddingTop: "40px"}}>
            <button
              className={classes.ButtonGreySmall}
              onClick={() => {
                this.setState({ transferOrder: {}, modal: "none", modalSpinner: false, transactionSuccess: "none"});

            }}>CONTINUE</button>
          </div>


        </div>
      )
    } else {
      let tempOrder = {...this.state.transferOrder};
      return (
        <div style={{fontSize: "24px", paddingTop: "80px", paddingBottom: "40px"}}>Your transaction was successfull
          <div style={{paddingTop: "40px"}}>
            <button
              className={classes.ButtonGreySmall}
              onClick={async() => {
              //const result = await gaEvent.methods
              //  .balanceOf(gaTicketDetails[tempOrder.index].creator)
              //  .call();
              //let tempState = [...this.state.gaTicketDetails];
              //tempState[newOrder.index].available = result;
              this.setState({ transferOrder: {}, display: "myTickets", modal: "none", modalSpinner: false, transactionSuccess: "none"});
            }
            }>CONTINUE</button>
          </div>
        </div>
      )
    }
  }

  orderModalBody = () => {
    const { web3, accounts, gaTicketDetails, newOrder } = this.state;
      const gaEvent = new web3.eth.Contract(
        GAEventTicket.abi,
        newOrder.address
      );

    let ticketsArray = [0]
    for (let i = 1; i <= newOrder.available; i++) {
      ticketsArray.push(i);
    }

    if(this.state.modalSpinner) {
      return (
        <Fragment>
          <div style={{fontSize: "24px", paddingTop: "60px"}}>Your order is being processed</div>
          <div style={{height: "80px", paddingTop: "10px"}}><Spinner/></div>
          <div style={{fontSize: "24px", paddingTop: "100px"}}>This can take up to 30 seconds</div>
        </Fragment>
      )
    } else if (this.state.transactionSuccess === "none") {
      return (
        <Fragment>
          <div style={{fontSize: "34px"}}>Ticket Order</div>
          <div style={{fontSize: "24px"}}>{newOrder.name}</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "50% 48%",
              columnGap: "2%"
            }}>
              <div style={{textAlign: "right"}}>
                <div style={{fontSize: "18px"}}>Ticket Symbol:</div>
                <div style={{fontSize: "18px"}}>Tickets Available:</div>
                <div style={{fontSize: "18px"}}>Ticket Price:</div>
              </div>
              <div style={{textAlign: "left"}}>
            <div style={{fontSize: "18px"}}>{newOrder.symbol}</div>
            <div style={{fontSize: "18px"}}>{newOrder.available}</div>
            <div style={{fontSize: "18px"}}>{newOrder.primaryPrice} wei</div>
              </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60% 38%",
              columnGap: "2%",
              paddingTop: "15px"
            }}>
            <div style={{fontSize: "24px", textAlign: "right", paddingTop: "8px"}}>Select Ticket Quantity</div>
            <div style={{fontSize: "24px", textAlign: "left"}}>
              <select
                style={{
                  padding: "9px 5px",
                  border: "1px solid lightgrey",
                  boxSizing: "borderBox",
                  width: "105px",
                  lineHeight: "1.75",
                  cursor: "pointer"}}
                type="text"
                id="input box time selection"
                value={newOrder.quantity}
                name="tickets"
                onChange={(event) => {
                  let tempOrder = {...newOrder};
                  tempOrder.quantity = event.target.value;
                  this.setState({newOrder: tempOrder})
                }}
                required
              >{ticketsArray.map(number => (<option>{number}</option>))}</select>
            </div>
            
            <div style={{fontSize: "24px", textAlign: "right"}}>Purchase Amount:</div>
            <div style={{fontSize: "24px", textAlign: "left"}}>{newOrder.quantity * newOrder.primaryPrice} wei</div>
          </div>
          <div style={{paddingTop: "20px"}}>
            <button
              className={
                parseInt(this.state.newOrder.quantity) === 0
                  ? classes.ButtonGreenSmallOpac
                  : classes.ButtonGreenSmall
              }
              disabled={parseInt(this.state.newOrder.quantity) === 0}
              onClick={async () => {
                this.setState({modalSpinner: true});
                let tempOrder = {...this.state.newOrder};

                let value = tempOrder.quantity * tempOrder.primaryPrice;

                try {
                  await gaEvent.methods
                    .primaryTransfer(tempOrder.quantity)
                    .send({ from: accounts[0], value: value });
                    this.setState({modalSpinner: false, transactionSuccess: "success"})

                } catch (error) {
                  console.log("Something happened")
                  this.setState({modalSpinner: false, transactionSuccess: "failure"})
                }
              }}
            >SUBMIT ORDER</button>
          </div>
          <div style={{paddingTop: "20px"}}>
            <button
              className={classes.ButtonGreySmall}
              onClick={() => {
                this.setState({ newOrder: {}, modal: "none", modalSpinner: false});
            }}>CANCEL ORDER</button>
          </div>
        </Fragment>
      ) 
    } else if (this.state.transactionSuccess === "failure") {
      return (
        <div style={{fontSize: "24px", paddingTop: "80px", paddingBottom: "40px"}}>Your transaction was not successfull
          <div style={{paddingTop: "40px"}}>
            <button
              className={classes.ButtonGreySmall}
              onClick={() => {
                this.setState({ newOrder: {}, modal: "none", modalSpinner: false, transactionSuccess: "none"});

            }}>CONTINUE</button>
          </div>


        </div>
      )
    } else {
      let tempOrder = {...this.state.newOrder};
      return (
        <div style={{fontSize: "24px", paddingTop: "80px", paddingBottom: "40px"}}>Your transaction was successfull
          <div style={{paddingTop: "40px"}}>
            <button
              className={classes.ButtonGreySmall}
              onClick={async() => {
              const result = await gaEvent.methods
                .balanceOf(gaTicketDetails[tempOrder.index].creator)
                .call();
              let tempState = [...this.state.gaTicketDetails];
              tempState[newOrder.index].available = result;
              this.setState({ gaTicketDetails: tempState, newOrder: {}, display: "myTickets", modal: "none", modalSpinner: false, transactionSuccess: "none"});
            }
            }>CONTINUE</button>
          </div>
        </div>
      )
    }
  }

  orderModal =  () => {
    if(this.state.modal === "buy") {
      const { web3, accounts, gaTicketDetails, newOrder } = this.state;
      return (
        <Fragment>
          <div className={classes.Backdrop}></div>
          <div
            style={{
              transform: this.state.modal === "buy" ? "translateY(0)" : "translateY(-100vh)",
              opacity: this.state.modal === "buy" ? "1" : "0",
            }}
            className={classes.Modal}
          >
            {this.orderModalBody()}
          </div>
        </Fragment>
      )
    } else
      return null;
  }

  transferModal =  () => {
    if(this.state.modal === "transfer") {
      const { web3, accounts, gaTicketDetails, newOrder } = this.state;
      return (
        <Fragment>
          <div className={classes.Backdrop}></div>
          <div
            style={{
              transform: this.state.modal === "transfer" ? "translateY(0)" : "translateY(-100vh)",
              opacity: this.state.modal === "transfer" ? "1" : "0",
            }}
            className={classes.Modal}
          >
            {this.transferModalBody()}
          </div>
        </Fragment>
      )
    } else
      return null;
  }

  render() {
    return (
      <Fragment>
        {this.header}
        <div>{this.accountHeader()}</div>
        <div>{this.orderModal()}</div>
        <div>{this.transferModal()}</div>

        

        <div className={classes.MainDisplay}>
          {this.eventsDisplay()}
          {this.issueTicketsDisplay()}
          {this.exchangeDisplay()}
          {this.myTicketsDisplay()}


          {this.state.display === "myEvents" || this.state.display === "all" ? (
            <div className={classes.Main}>
              <div className={classes.PageTitle}>My Events
              </div>
              <section className={classes.Events}>
                {this.myEventList()}
              </section>
            </div>
          ) : null}
        </div>
      </Fragment>
    );
  }
}

export default App;

/*
async loadBlockchainData() {
  // Get network provider and web3 instance.
  const web3 = await getWeb3(); //dup

  // function from "web3.eth.net" library that gets current network ID
  const networkId = await web3.eth.net.getId(); //dup

  // function from "web3.eth.net" library that gets current network ID
  const network = await web3.eth.net.getNetworkType(); //dup

  const accounts = await web3.eth.getAccounts(); //dup

  const address1 = Token.networks[networkId].address; //dup

  // create an instance of the contract using an instance of Web3
  const token = new web3.eth.Contract(
    Token.abi,
    Token.networks[networkId].address
  );

  const totalSupply = await token.methods.totalSupply().call();

  const address2 = Factory.networks[networkId].address; //dup

  // create an instance of the contract using an instance of Web3
  const factory = new web3.eth.Contract( //dup
    Factory.abi, //dup
    Factory.networks[networkId].address //dup
  );

  const owner = await token.methods.owner().call();
}
*/
