import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { Account } from "../lib/accounts/account";
import { Client, PrivkeyAccount, RPCClient } from "../lib";
import { Network } from "../lib/networks";
import { Context } from "../lib/context";
import { Transaction } from "../lib/transaction";
import { Data } from "./data/data";

@suite
class TransactionUnitTests {
  account1: Account;
  account2: Account;

  url: URL;
  client: Client;

  utxos: any[];
  constructor() {
    this.utxos = [
      {
        address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
        txid: "00df7facfd59e1ddfe607a4945cd95bce48fed5db69d9a5cb0aac9467f2bd3d4",
        outputIndex: 1,
        script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
        satoshis: 4899999000,
        height: 91832,
      },
      {
        address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
        txid: "a0d31ada8812070d06bcb5d6c8bb75eb1d6c8d89d0f7dcd2a33f90543cd15ec9",
        outputIndex: 1,
        script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
        satoshis: 4820357560,
        height: 91841,
      },
      {
        address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
        txid: "c4f6d1a7e2858d0df92b30618e2eddfecfa2a2f204c47a1155f5abffbda0dce1",
        outputIndex: 1,
        script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
        satoshis: 4866099000,
        height: 92177,
      },
    ];
    this.account1 = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "aad2ac52013d42dcdc5df1856b434ebf4a683be5c503df28da91bb2ea7e4b40e"
    );
    this.account2 = new PrivkeyAccount(
      new Context().withNetwork(Network.Regtest),
      "75b7a650ebff934602d2b097569070c809d79ca761f2729b5f7b7c9fe5e82da1"
    );
    this.url = new URL("http://guest:guest@127.0.0.1:8545");
    this.client = new Client(this.url.href);
  }

  @test
  call() {
    const t = new Transaction();
    const data = t.call(
      "a9059cbb0000000000000000000000003bf7bdb3b6cbf3fa961840cf268f80b1798a7f8e0000000000000000000000000000000000000000000000000000000000000001",
      40,
      22000,
      "0x6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c"
    );

    const outputs = t.getOutputs();
    expect(outputs).to.be.not.empty;

    const output = outputs[0];
    const chunks = output.script.chunks;
    const version = chunks[0].buf.toString("hex");
    const gasLimit = chunks[1].buf.toString("hex");
    const gasPrice = chunks[2].buf.toString("hex");
    const calldata = chunks[3].buf.toString("hex");
    const contract = chunks[4].buf.toString("hex");
    const opcode = chunks[5].opcodenum;

    expect(version).to.equal("04");
    expect(gasLimit).to.equal("f055");
    expect(gasPrice).to.equal("28");
    expect(contract).to.equal("6c0ade60f61d37956ae9dd454a86a6bc7ea3b52c");
    expect(calldata).to.equal(
      "a9059cbb0000000000000000000000003bf7bdb3b6cbf3fa961840cf268f80b1798a7f8e0000000000000000000000000000000000000000000000000000000000000001"
    );
    expect(opcode).to.be.equal(0xc2);

    t.build([this.account1], this.utxos);
    expect(t.getFee()).to.be.greaterThan(40 * 22000);
  }

  @test
  create() {
    const t = new Transaction();
    const data = t.call(Data.code, 40, 2200000);

    const outputs = t.getOutputs();
    expect(outputs).to.be.not.empty;

    const output = outputs[0];
    const chunks = output.script.chunks;
    const version = chunks[0].buf.toString("hex");
    const gasLimit = chunks[1].buf.toString("hex");
    const gasPrice = chunks[2].buf.toString("hex");
    const calldata = chunks[3].buf.toString("hex");
    const opcode = chunks[4].opcodenum;

    expect(version).to.equal("04");
    expect(gasLimit).to.equal("c09121");
    expect(gasPrice).to.equal("28");
    expect(calldata).to.equal(Data.code);
    expect(opcode).to.be.equal(0xc1);

    t.build([this.account1], this.utxos);
    expect(t.getFee()).to.be.greaterThan(40 * 2200000);
  }

  @test
  invalidTransaction() {
    const t = new Transaction();
    t.to("TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE", 1);
    t.build([this.account1], this.utxos);
    expect(() => {
      t.serialize(false);
    }).to.throw("Dust amount detected in one output");
    expect(() => {
      t.serialize(true);
    }).to.not.throw();

    const t1 = new Transaction();
    t1.to("TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE", 1);
    t1.fee(88000000);
    t1.build([this.account1], this.utxos);
    expect(() => {
      t1.serialize(false);
    }).to.throw("Fee is too large");
    expect(() => {
      t1.serialize(true);
    }).to.not.throw();
  }

  @test
  from() {
    const t = new Transaction();
    t.from({
      address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      txid: "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba",
      outputIndex: 1,
      script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
      satoshis: 4801235000,
      height: 84830,
    });

    const inputs = t.getInputs();
    expect(inputs).to.be.not.empty;

    const input = inputs[0];
    expect(input.prevTxId.toString("hex")).to.be.equal(
      "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba"
    );
    expect(input.outputIndex).to.be.equal(1);
    expect(input.output.satoshis).to.be.equal(4801235000);
  }

  @test
  signManyKeys() {
    const t = new Transaction();
    t.from({
      address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      txid: "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba",
      outputIndex: 1,
      script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
      satoshis: 4801235000,
      height: 84830,
    });
    t.from({
      address: "TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T",
      txid: "50642aea4fa7aa7d59b6e3aa5d33d481d7cea90f5a406cb45e656adc7b2919f0",
      outputIndex: 0,
      script: "76a9144c7317165648ca7d1c66845cb1afba5fa845387388ac",
      satoshis: 10000000000,
      height: 182001,
    });

    t.sign(this.account1);
    expect(t.getInputs()[0].script.chunks).to.be.not.empty;
    expect(t.getInputs()[1].script.chunks).to.be.empty;

    t.sign(this.account2);
    expect(t.getInputs()[0].script.chunks).to.be.not.empty;
    expect(t.getInputs()[1].script.chunks).to.be.not.empty;
  }

  // sendTransaction
  @test
  addInputsOverRequired() {
    const utxos = [];
    const t = new Transaction(undefined);
    t.from({
      address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      txid: "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba",
      outputIndex: 1,
      script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
      satoshis: 4801235000,
      height: 84830,
    });
    t.to("TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T", 1e8);
    t.build([this.account1], this.utxos);

    expect(t.getInputs().length).to.be.equal(1);
    expect(t.getOutputs().length).to.be.equal(2);
  }

  @test
  addInputsUnderRequired() {
    const t = new Transaction(undefined);
    t.from({
      address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      txid: "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba",
      outputIndex: 1,
      script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
      satoshis: 4801235000,
      height: 84830,
    });
    t.to("TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T", 4801235001);
    t.build([this.account1], this.utxos);

    expect(t.getInputs().length).to.be.equal(2);
    expect(t.getOutputs().length).to.be.equal(2);
  }

  @test
  useNoDuplicateInput() {
    const t = new Transaction(undefined);
    t.from({
      address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      txid: "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba",
      outputIndex: 1,
      script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
      satoshis: 4801235000,
      height: 84830,
    });
    t.to("TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T", 4801235001);
    expect(() => {
      t.build(
        [this.account1],
        [
          {
            address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
            txid: "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba",
            outputIndex: 1,
            script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
            satoshis: 4801235000,
            height: 84830,
          },
        ]
      );
    }).to.throw("Not enough funds to create transaction");
  }

  @test
  changeToSpecific() {
    const t = new Transaction(undefined);
    t.from({
      address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      txid: "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba",
      outputIndex: 1,
      script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
      satoshis: 4801235000,
      height: 84830,
    });
    t.to("TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T", 4801235001);
    t.change("TGo5JGp3ryt6d78pqDL3BudYbfC7UhLqPV");
    t.build([this.account1], this.utxos);

    expect(t.getInputs().length).to.be.equal(2);
    expect(t.getOutputs().length).to.be.equal(2);
    const change = t.getOutputs()[1];

    expect(change.toObject().script).to.be.equal(
      "76a9144ade4a623ac92d1746f24f391b89997e6372b90b88ac"
    );
  }

  @test
  changeToDefault() {
    const t = new Transaction(undefined);
    t.from({
      address: "TMZZPF9Rzow8pt2RAqumTWRXo2AkKaYgaE",
      txid: "150077feae1366b7abded0864bcdaef881313a6115c7870dcda755757d1d4dba",
      outputIndex: 1,
      script: "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac",
      satoshis: 4801235000,
      height: 84830,
    });
    t.to("TGwSEF8AeYUeMf5aDTavry8Xuvdn9zKM5T", 4801235001);
    t.build([this.account1], this.utxos);

    expect(t.getInputs().length).to.be.equal(2);
    expect(t.getOutputs().length).to.be.equal(2);
    const change = t.getOutputs()[1];

    expect(change.toObject().script).to.be.equal(
      "76a9147f288a70fea402dcf5ddbadd155ae7545af4fae088ac"
    );
  }

  @test
  gasLimit() {
    const t = new Transaction(undefined);
    expect(() => {
      t.call("", 10001, 10);
    }).to.throw("Gas price is exceed limit: 10001 > 10000");
    expect(() => {
      t.call("", 10000, 10_000_001);
    }).to.throw("Gas limit is exceed limit: 10000001 > 10000000");
    expect(() => {
      t.call("", 10000, 100001);
    }).to.throw("Gas is exceed limit: 1000010000 > 1000000000");

    const t1 = new Transaction(undefined, { maxGasLimit: 100 * 1e6 });
    expect(() => {
      t1.call("", 10001, 10);
    }).to.throw("Gas price is exceed limit: 10001 > 10000");
    expect(() => {
      t1.call("", 10, 100000000);
    }).to.not.throw();
    expect(() => {
      t1.call("", 10000, 100000001);
    }).to.throw("Gas limit is exceed limit: 100000001 > 100000000");
    expect(() => {
      t1.call("", 10000, 100001);
    }).to.throw("Gas is exceed limit: 1000010000 > 1000000000");

    const t2 = new Transaction(undefined, { maxGasPrice: 100000 });
    expect(() => {
      t2.call("", 10001, 10);
    }).to.not.throw();
    expect(() => {
      t2.call("", 100001, 10);
    }).to.throw("Gas price is exceed limit: 100001 > 100000");
    expect(() => {
      t2.call("", 10000, 10_000_001);
    }).to.throw("Gas limit is exceed limit: 10000001 > 10000000");
    expect(() => {
      t2.call("", 10000, 100001);
    }).to.throw("Gas is exceed limit: 1000010000 > 1000000000");

    const t3 = new Transaction(undefined, { maxGas: 100 * 1e8 });
    expect(() => {
      t3.call("", 10001, 10);
    }).to.throw("Gas price is exceed limit: 10001 > 10000");
    expect(() => {
      t3.call("", 10000, 10_000_001);
    }).to.throw("Gas limit is exceed limit: 10000001 > 10000000");
    expect(() => {
      t3.call("", 10000, 1000000);
    }).to.not.throw();
    expect(() => {
      t3.call("", 10000, 1000001);
    }).to.throw("Gas is exceed limit: 10000010000 > 10000000000");
  }

  @test
  serialize_raw_tx() {
    const t = new Transaction(Data.rawTx);
    const outputs = t.getOutputs();
    const inputs = t.getInputs();
    expect(outputs).to.be.not.empty;
    expect(inputs).to.be.not.empty;

    const output = outputs[0];
    const input = inputs[0];
    const chunks = output.script.chunks;
    const version = chunks[0].buf.toString("hex");
    const gasLimit = chunks[1].buf.toString("hex");
    const gasPrice = chunks[2].buf.toString("hex");
    const calldata = chunks[3].buf.toString("hex");
    const opcode = chunks[4].opcodenum;

    expect(version).to.equal("04");
    expect(gasLimit).to.equal("c09121");
    expect(gasPrice).to.equal("28");
    expect(calldata).to.equal(Data.code);
    expect(opcode).to.be.equal(0xc1);

    expect(input.prevTxId.toString("hex")).to.be.equal(
      "00df7facfd59e1ddfe607a4945cd95bce48fed5db69d9a5cb0aac9467f2bd3d4"
    );
    expect(input.outputIndex).to.be.equal(1);
  }
}
