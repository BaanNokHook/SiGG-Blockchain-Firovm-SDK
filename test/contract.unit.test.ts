import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { Client } from "../lib/client";
import nock from "nock";
import abi from "./data/abi.json";
import { Contract } from "../lib/contract";
import { PrivkeyAccount } from "../lib/accounts/privkey_account";
import { Network } from "../lib/networks";
import { Context } from "../lib/context";
import * as _ from "lodash";
import response from "./data/response.json";

@suite
class ContractUnitTests {
  url: URL;
  client: Client;
  contract: Contract;
  contractAddress: string;
  account: PrivkeyAccount;

  constructor() {
    this.url = new URL("http://guest:guest@127.0.0.1:8545");
    this.client = new Client(this.url.href);
    this.contractAddress = "0x8a62f1a163aa7fc9e1ba370eb27d52cdbbb60949";
    this.contract = new this.client.Contract(abi, this.contractAddress);
    this.account = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "cRhFsXE18dzNJwDM8Xg32vLAUtbFd9SK1DyCALxwmgFSRrCG98j1"
    );
  }

  after() {
    nock.cleanAll();
  }

  @test
  async callDecimals() {
    nock(this.url.origin).post("/").once().reply(200, response.callDecimals);

    const methodDecimals = this.contract.methods.decimals();
    expect(methodDecimals.encodeABI()).to.equal("0x313ce567");
    expect(methodDecimals.getDecodeParameters()).to.eql(["uint8"]);
    expect(methodDecimals.name).to.equal("decimals");
    expect(methodDecimals.args).to.eql([]);

    const decimals = await methodDecimals.call();
    expect(decimals).to.deep.equal({ "0": "18", __length__: 1 });
  }

  @test
  async callBalanceOf() {
    nock(this.url.origin).post("/").once().reply(200, response.callBalanceOf);

    const methodBalanceOf = this.contract.methods.balanceOf(
      "0xcd99155ae57460ee1d7a37784bfd31ffa7dbb661"
    );
    expect(methodBalanceOf.encodeABI()).to.equal(
      "0x70a08231000000000000000000000000cd99155ae57460ee1d7a37784bfd31ffa7dbb661"
    );
    expect(methodBalanceOf.getDecodeParameters()).to.eql(["uint256"]);
    expect(methodBalanceOf.name).to.equal("balanceOf");
    expect(methodBalanceOf.args).to.eql([
      "0xcd99155ae57460ee1d7a37784bfd31ffa7dbb661",
    ]);

    const balanceOf = await methodBalanceOf.call();
    expect(balanceOf).to.deep.equal({
      "0": "100000000000000000000",
      __length__: 1,
    });
  }

  @test
  async callSymbol() {
    nock(this.url.origin).post("/").once().reply(200, response.callSymbol);

    const methodSymbol = this.contract.methods.symbol();
    expect(methodSymbol.encodeABI()).to.equal("0x95d89b41");
    expect(methodSymbol.getDecodeParameters()).to.eql(["string"]);
    expect(methodSymbol.name).to.equal("symbol");
    expect(methodSymbol.args).to.eql([]);

    const symbol = await methodSymbol.call();
    expect(symbol).to.deep.equal({ "0": "GLD", __length__: 1 });
  }

  @test
  async callAllowance() {
    nock(this.url.origin).post("/").once().reply(200, response.callAllowance);

    const methodAllowance = this.contract.methods.allowance(
      "0xcd99155ae57460ee1d7a37784bfd31ffa7dbb661",
      "0xba723d15e07f168e7797a9dce0bec0ee2f383865"
    );
    expect(methodAllowance.encodeABI()).to.equal(
      "0xdd62ed3e000000000000000000000000cd99155ae57460ee1d7a37784bfd31ffa7dbb661000000000000000000000000ba723d15e07f168e7797a9dce0bec0ee2f383865"
    );
    expect(methodAllowance.getDecodeParameters()).to.eql(["uint256"]);
    expect(methodAllowance.name).to.equal("allowance");
    expect(methodAllowance.args).to.eql([
      "0xcd99155ae57460ee1d7a37784bfd31ffa7dbb661",
      "0xba723d15e07f168e7797a9dce0bec0ee2f383865",
    ]);

    const allowance = await methodAllowance.call();
    expect(allowance).to.deep.equal({ "0": "100", __length__: 1 });
  }

  @test
  async sendApprove() {
    nock(this.url.origin)
      .post("/", _.matches({ method: "getaddressutxos" }))
      .once()
      .reply(200, response.sendApprove.getAddressUtxos);

    nock(this.url.origin)
      .post("/", _.matches({ method: "fromhexaddress" }))
      .once()
      .reply(200, response.sendApprove.fromHexAddress);

    nock(this.url.origin)
      .post("/", _.matches({ method: "sendrawtransaction" }))
      .once()
      .reply(200, response.sendApprove.sendRawTransaction);

    const methodApprove = this.contract.methods.approve(
      "0xba723d15e07f168e7797a9dce0bec0ee2f383865",
      100
    );
    expect(methodApprove.encodeABI()).to.equal(
      "0x095ea7b3000000000000000000000000ba723d15e07f168e7797a9dce0bec0ee2f3838650000000000000000000000000000000000000000000000000000000000000064"
    );
    expect(methodApprove.getDecodeParameters()).to.eql(["bool"]);
    expect(methodApprove.name).to.equal("approve");
    expect(methodApprove.args).to.eql([
      "0xba723d15e07f168e7797a9dce0bec0ee2f383865",
      100,
    ]);

    const txid = await methodApprove.send({ from: this.account });
    expect(txid).to.equal(response.sendApprove.sendRawTransaction.result);
  }

  @test
  async sendTransfer() {
    nock(this.url.origin)
      .post("/", _.matches({ method: "getaddressutxos" }))
      .once()
      .reply(200, response.sendTransfer.getAddressUtxos);

    nock(this.url.origin)
      .post("/", _.matches({ method: "fromhexaddress" }))
      .once()
      .reply(200, response.sendTransfer.fromHexAddress);

    nock(this.url.origin)
      .post("/", _.matches({ method: "sendrawtransaction" }))
      .once()
      .reply(200, response.sendTransfer.sendRawTransaction);

    const methodTransfer = this.contract.methods.transfer(
      "0xba723d15e07f168e7797a9dce0bec0ee2f383865",
      100
    );
    expect(methodTransfer.encodeABI()).to.equal(
      "0xa9059cbb000000000000000000000000ba723d15e07f168e7797a9dce0bec0ee2f3838650000000000000000000000000000000000000000000000000000000000000064"
    );
    expect(methodTransfer.getDecodeParameters()).to.eql(["bool"]);
    expect(methodTransfer.name).to.equal("transfer");
    expect(methodTransfer.args).to.eql([
      "0xba723d15e07f168e7797a9dce0bec0ee2f383865",
      100,
    ]);

    const txid = await methodTransfer.send({ from: this.account });
    expect(txid).to.equal(response.sendTransfer.sendRawTransaction.result);
  }

  @test
  async deployContract() {
    nock(this.url.origin)
      .post("/", _.matches({ method: "getaddressutxos" }))
      .once()
      .reply(200, response.deployContract.getAddressUtxos);

    nock(this.url.origin)
      .post("/", _.matches({ method: "sendrawtransaction" }))
      .once()
      .reply(200, response.deployContract.sendRawTransaction);

    const data =
      "608060405234801561001057600080fd5b5060405161020638038061020683398181016040528101906100329190610054565b80600081905550506100a7565b60008151905061004e81610090565b92915050565b60006020828403121561006a5761006961008b565b5b60006100788482850161003f565b91505092915050565b6000819050919050565b600080fd5b61009981610081565b81146100a457600080fd5b50565b610150806100b66000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100d9565b60405180910390f35b610073600480360381019061006e919061009d565b61007e565b005b60008054905090565b8060008190555050565b60008135905061009781610103565b92915050565b6000602082840312156100b3576100b26100fe565b5b60006100c184828501610088565b91505092915050565b6100d3816100f4565b82525050565b60006020820190506100ee60008301846100ca565b92915050565b6000819050919050565b600080fd5b61010c816100f4565b811461011757600080fd5b5056fea264697066735822122073cc8a437197f49139b47e9f8bbbcc2a69cad4270bd6a6d387e7ae52004fc7b164736f6c63430008070033";
    const contract = new this.client.Contract(abi);
    const contractDeploy = contract.deploy(data, ["100000000000000000000"]);
    expect(contractDeploy.encodeABI()).to.equal(
      "608060405234801561001057600080fd5b5060405161020638038061020683398181016040528101906100329190610054565b80600081905550506100a7565b60008151905061004e81610090565b92915050565b60006020828403121561006a5761006961008b565b5b60006100788482850161003f565b91505092915050565b6000819050919050565b600080fd5b61009981610081565b81146100a457600080fd5b50565b610150806100b66000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80632e64cec11461003b5780636057361d14610059575b600080fd5b610043610075565b60405161005091906100d9565b60405180910390f35b610073600480360381019061006e919061009d565b61007e565b005b60008054905090565b8060008190555050565b60008135905061009781610103565b92915050565b6000602082840312156100b3576100b26100fe565b5b60006100c184828501610088565b91505092915050565b6100d3816100f4565b82525050565b60006020820190506100ee60008301846100ca565b92915050565b6000819050919050565b600080fd5b61010c816100f4565b811461011757600080fd5b5056fea264697066735822122073cc8a437197f49139b47e9f8bbbcc2a69cad4270bd6a6d387e7ae52004fc7b164736f6c634300080700330000000000000000000000000000000000000000000000056bc75e2d63100000"
    );
    expect(contractDeploy.name).to.equal("constructor");
    expect(contractDeploy.args).to.eql(["100000000000000000000"]);

    const txid = await contractDeploy.send({ from: this.account });
    expect(txid).to.equal(response.deployContract.sendRawTransaction.result);
  }
}
