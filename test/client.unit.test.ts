import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { RPCClient } from "../lib/rpc";
import nock from "nock";
import { Client } from "../lib/client";
import { PrivkeyAccount } from "../lib/accounts/privkey_account";
import { Context } from "../lib/context";
import { Network } from "../lib/networks";
import { lookupRPCFromFile } from "./utils";
import * as fvmcore from "fvmcore-lib";

import sendData from "./data/send_data.json";
import { decode } from "punycode";
import { Transaction } from "../lib/transaction";
import { assert } from "console";
import * as _ from "lodash";
import { Data } from "./data/data";
import response from "./data/response.json";

@suite
class ClientUnitTests {
  url: URL;
  client: Client;

  constructor() {
    // this.url = new URL("http://45.76.186.22");
    this.url = new URL("http://guest:guest@127.0.0.1:8545");
    this.client = new Client(this.url.href);
  }

  after() {
    nock.cleanAll();
  }

  @test
  async getAddressTxs() {
    nock(this.url.origin)
      .persist()
      .post("/")
      .reply(200, (uri, body) => {
        const content = lookupRPCFromFile(
          body["id"],
          body["method"],
          body["params"],
          sendData,
          true
        );
        return content;
      });
    const txs = await this.client.getaddresstxs(
      ["TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T"],
      182000,
      182001
    );

    expect(txs.length).to.be.equal(1);
    expect(txs[0].hash).to.be.equal(
      "50642aea4fa7aa7d59b6e3aa5d33d481d7cea90f5a406cb45e656adc7b2919f0"
    );

    const txs2 = await this.client.getaddresstxs([
      "TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T",
    ]);

    expect(txs2.length).to.be.equal(1);
    expect(txs2[0].hash).to.be.equal(
      "50642aea4fa7aa7d59b6e3aa5d33d481d7cea90f5a406cb45e656adc7b2919f0"
    );

    const txs3 = await this.client.getaddresstxs(
      ["TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T"],
      182000
    );

    expect(txs3.length).to.be.equal(1);
    expect(txs3[0].hash).to.be.equal(
      "50642aea4fa7aa7d59b6e3aa5d33d481d7cea90f5a406cb45e656adc7b2919f0"
    );

    const txs4 = await this.client.getaddresstxs(
      ["TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T"],
      182010
    );

    expect(txs4.length).to.be.equal(0);
  }

  @test
  async sendFrom() {
    let rawTx: string = "";
    nock(this.url.origin)
      .post("/")
      .thrice()
      .reply(200, (uri, body) => {
        if (body["method"] === "sendrawtransaction") {
          rawTx = body["params"][0];
        }
        const content = lookupRPCFromFile(
          body["id"],
          body["method"],
          body["params"],
          sendData
        );
        return content;
      });

    const account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "aad2ac52013d42dcdc5df1856b434ebf4a683be5c503df28da91bb2ea7e4b40e"
    );

    const txId = await this.client.sendFrom(
      account,
      [
        {
          to: "TFSHej1QVx67UUBpTPkkCLtNAQkna63oVU",
          value: 1e8,
        },
      ],
      { feePerKb: 1000 }
    );

    const decoded = new fvmcore.Transaction(Buffer.from(rawTx, "hex"));
    const val = decoded.outputs.find((output) => output.satoshis === 1e8);
    expect(val).to.be.not.null;

    const script = val?.script.toHex();
    expect(script).to.be.equal(
      "76a9143bf7bdb3b6cbf3fa961840cf268f80b1798a7f8e88ac"
    );
  }

  @test
  async sendTokenFrom() {
    let rawTx: string = "";
    nock(this.url.origin)
      .persist()
      .post("/")
      .reply(200, (uri, body) => {
        if (body["method"] === "sendrawtransaction") {
          rawTx = body["params"][0];
        }
        const content = lookupRPCFromFile(
          body["id"],
          body["method"],
          body["params"],
          sendData
        );
        return content;
      });

    const account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "aad2ac52013d42dcdc5df1856b434ebf4a683be5c503df28da91bb2ea7e4b40e"
    );

    const txId = await this.client.tokenTransfer(
      account,
      "0x6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c",
      "TFSHej1QVx67UUBpTPkkCLtNAQkna63oVU",
      BigInt(1),
      { feePerKb: 1000 }
    );

    const decoded = new fvmcore.Transaction(Buffer.from(rawTx, "hex"));
    const val = decoded.outputs.find((output) => output.satoshis === 0);
    expect(val).to.be.not.null;

    const script = val?.script;
    const chunks = script.chunks;
    const calldata = chunks[3].buf.toString("hex");
    const contract = chunks[4].buf.toString("hex");

    expect(contract).to.equal("6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c");
    expect(calldata).to.equal(
      "a9059cbb0000000000000000000000003bf7bdb3b6cbf3fa961840cf268f80b1798a7f8e0000000000000000000000000000000000000000000000000000000000000001"
    );
  }

  @test
  async getBestBlockHash() {
    nock(this.url.origin)
      .post("/")
      .once()
      .reply(200, response.getBestBlockHash);
    const balance = await this.client.getBalance(
      "TSy3YBFebUV79oZ1ijAzEEj8ULoV6GZnEQ"
    );
    expect(balance.toFixed()).to.be.equal("10669362215808");
  }

  @test
  async getTokenBalance() {
    nock(this.url.origin)
      .post("/")
      .twice()
      .reply(200, (uri, body) => {
        console.log("method", body["method"]);
        switch (body["method"]) {
          case "frc20decimals":
            return response.getTokenDecimals;
          default:
            return response.getTokenBalance;
        }
      });
    const tokenBalance = await this.client.getTokenBalance(
      "3c76244790d45eef410f001d05ee5a5527f42b16",
      "TSy3YBFebUV79oZ1ijAzEEj8ULoV6GZnEQ"
    );
    expect(tokenBalance.decimals).to.be.equal(18);
    expect(tokenBalance.balance).to.be.equal(BigInt("7748920000000000000"));
  }

  @test
  async estimateGas() {
    const res = {
      jsonrpc: "2.0",
      result: {
        address: "6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c",
        executionResult: {
          codeDeposit: 0,
          depositSize: 0,
          excepted: "None",
          exceptedMessage: "",
          gasForDeposit: 0,
          gasRefunded: 0,
          gasUsed: 36917,
          newAddress: "6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c",
          output:
            "0000000000000000000000000000000000000000000000000000000000000001",
        },
        transactionReceipt: {
          bloom:
            "00000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000110000000000000200000000000000000000000000000000000000000000000000008000000000000000000000010000000008000000000000000000000000200000000000000004002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          gasUsed: 36917,
          log: [Array],
          stateRoot:
            "ea12d571c3eb101620ff1cbacffb244cfb6defd911510b79e9207fd506a38ffd",
          utxoRoot:
            "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
        },
      },
      id: "1642585147087",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const estimated = await this.client.estimateFee(
      "6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c",
      "a9059cbb0000000000000000000000003bf7bdb3b6cbf3fa961840cf268f80b1798a7f8e0000000000000000000000000000000000000000000000000000000000000001",
      "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE"
    );
    expect(estimated).to.be.equal(36917);
  }

  @test
  async estimateGasCreateContract() {
    const res = {
      jsonrpc: "2.0",
      result: {
        address: "",
        executionResult: {
          codeDeposit: 2,
          depositSize: 13033,
          excepted: "None",
          exceptedMessage: "",
          gasForDeposit: 4294523264,
          gasRefunded: 0,
          gasUsed: 3050630,
          newAddress: "d33b70b905f59fac92d69d0978917524660a5f13",
          output: "608060405234801561001057600080fd5b506004",
        },
        transactionReceipt: {
          bloom:
            "00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          gasUsed: 3050630,
          log: [],
          stateRoot:
            "ea12d571c3eb101620ff1cbacffb244cfb6defd911510b79e9207fd506a38ffd",
          utxoRoot:
            "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
        },
      },
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const estimated = await this.client.estimateFee(
      "",
      Data.code,
      "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE"
    );

    expect(estimated).to.be.equal(3050630);
  }

  @test
  createURINative() {
    const account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "aad2ac52013d42dcdc5df1856b434ebf4a683be5c503df28da91bb2ea7e4b40e"
    );
    const address = account.address();
    const amount = 120000000;
    const outputURI = "bitcoin:TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE?amount=1.2";

    const uriString = this.client.createURI(address, amount);
    expect(uriString).to.be.equal(outputURI);
  }

  @test
  createURIToken() {
    const account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "aad2ac52013d42dcdc5df1856b434ebf4a683be5c503df28da91bb2ea7e4b40e"
    );
    const address = account.address();
    const amount = 0;
    const message = "This is a message";
    const label = "This is a label";
    const contractAddress = "0x6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c";
    const amountToken = 15;
    const outputURI =
      "bitcoin:TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE?amount=0&message=This%20is%20a%20message&label=This%20is%20a%20label&contractAddress=0x6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c&amountToken=15000000000000000000";

    const uriString = this.client.createURI(
      address,
      amount,
      message,
      label,
      contractAddress,
      BigInt("15000000000000000000")
    );
    expect(uriString).to.be.equal(outputURI);
  }

  @test
  validateURINative() {
    const uriString = "bitcoin:TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE?amount=1.2";
    const account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "aad2ac52013d42dcdc5df1856b434ebf4a683be5c503df28da91bb2ea7e4b40e"
    );
    const uri = this.client.validateURI(uriString);

    expect(uri.address.toString()).to.be.equal(
      "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE"
    );
    expect(uri.amount.toString()).to.be.equal("120000000");
    expect(uri.message).to.be.equal(null);
    expect(uri.label).to.be.equal(undefined);
    expect(uri.contractAddress).to.be.equal(undefined);
    expect(uri.amountToken.toString()).to.be.equal("0");
  }

  @test
  validateURIToken() {
    const uriString =
      "bitcoin:TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE?message=This%20is%20a%20message&label=This%20is%20a%20label&contractAddress=0x6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c&amountToken=15000000000000000000";
    const account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "aad2ac52013d42dcdc5df1856b434ebf4a683be5c503df28da91bb2ea7e4b40e"
    );
    const uri = this.client.validateURI(uriString);

    expect(uri.address.toString()).to.be.equal(
      "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE"
    );
    expect(uri.amount.toString()).to.be.equal("0");
    expect(uri.message).to.be.equal("This is a message");
    expect(uri.label).to.be.equal("This is a label");
    expect(uri.amountToken.toString()).to.be.equal("15000000000000000000");
    expect(uri.contractAddress).to.be.equal(
      "0x6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c"
    );
  }

  @test
  async payToURIWithNative() {
    nock(this.url.origin)
      .post("/", _.matches({ method: "getaddressutxos" }))
      .once()
      .reply(200, response.payToURIWithNative.getAddressUtxos);

    nock(this.url.origin)
      .post("/", _.matches({ method: "gethexaddress" }))
      .once()
      .reply(200, response.payToURIWithNative.getHexAddress);

    nock(this.url.origin)
      .post("/", _.matches({ method: "sendrawtransaction" }))
      .once()
      .reply(200, response.payToURIWithNative.sendRawTransaction);

    const uriString = this.client.createURI(
      "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      120000000
    );

    const account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "cRhFsXE18dzNJwDM8Xg32vLAUtbFd9SK1DyCALxwmgFSRrCG98j1"
    );

    const txId = await this.client.payToURI(account, uriString);
    expect(uriString).to.be.equal(
      "bitcoin:TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE?amount=1.2"
    );
    expect(txId).to.be.equal(
      response.payToURIWithNative.sendRawTransaction.result
    );
  }

  @test
  async payToURIWithToken() {
    nock(this.url.origin)
      .post("/", _.matches({ method: "getaddressutxos" }))
      .once()
      .reply(200, response.payToURIWithToken.getAddressUtxos);

    nock(this.url.origin)
      .post("/", _.matches({ method: "gethexaddress" }))
      .once()
      .reply(200, response.payToURIWithToken.getHexAddress);

    nock(this.url.origin)
      .post("/", _.matches({ method: "callcontract" }))
      .once()
      .reply(200, response.payToURIWithToken.callContract);

    nock(this.url.origin)
      .post("/", _.matches({ method: "sendrawtransaction" }))
      .once()
      .reply(200, response.payToURIWithToken.sendRawTransaction);

    const uriString = this.client.createURI(
      "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      0,
      "",
      "",
      "0x6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c",
      BigInt("15000000000000000000")
    );
    const account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "cRhFsXE18dzNJwDM8Xg32vLAUtbFd9SK1DyCALxwmgFSRrCG98j1"
    );

    const txId = await this.client.payToURI(account, uriString);
    expect(uriString).to.be.equal(
      "bitcoin:TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE?amount=0&contractAddress=0x6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c&amountToken=15000000000000000000"
    );
    expect(txId).to.be.equal(
      response.payToURIWithToken.sendRawTransaction.result
    );
  }
}
