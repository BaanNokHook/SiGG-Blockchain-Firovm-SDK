import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { RPCClient } from "../lib/rpc";
import nock from "nock";

@suite
class RPCClientUnitTests {
  url: URL;
  rpc: RPCClient;

  constructor() {
    this.url = new URL("http://guest:guest@127.0.0.1:8545");
    this.rpc = new RPCClient(this.url.href);
  }

  after() {
    nock.cleanAll();
  }

  @test
  async getBestBlockHash() {
    const res = {
      result:
        "188d02f4c5209144506556b6ba380b63710346566011c7686a9a6c80ecf1911f",
      error: null,
      id: "1640081264664",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const blockHash = await this.rpc.getBestBlockHash();
    expect(blockHash).to.be.not.empty;
    expect(blockHash.result).to.be.equal(res.result);
    expect(blockHash.error).to.be.null;
  }

  @test
  async getBlockChainInfo() {
    const res = {
      result: {
        chain: "regtest",
        blocks: 50449,
        headers: 50449,
        bestblockhash:
          "188d02f4c5209144506556b6ba380b63710346566011c7686a9a6c80ecf1911f",
        moneysupply: 21514043,
        maxsupply: 0,
        mediantime: 1639760603,
        verificationprogress: 1,
        initialblockdownload: true,
        size_on_disk: 22826957,
        pruned: false,
        warnings: "",
      },
      error: null,
      id: "1640083263339",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const blockChainInfo = await this.rpc.getBlockChainInfo();
    expect(blockChainInfo).to.be.not.empty;
    expect(blockChainInfo.result.chain).to.be.equal(res.result.chain);
    expect(blockChainInfo.error).to.be.null;
  }

  @test
  async getBalance() {
    const res = {
      result: 21294182.63168467,
      error: null,
      id: "1640103057434",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const balance = await this.rpc.getBalance();
    expect(balance).to.be.not.empty;
    expect(balance.result).to.be.equal(res.result);
    expect(balance.error).to.be.null;
  }

  @test
  async getBalances() {
    const res = {
      result: {
        mine: { trusted: 21294182.63168467, untrusted_pending: 0, immature: 0 },
        watchonly: {
          trusted: 185982.18792577,
          untrusted_pending: 0,
          immature: 0,
        },
      },
      error: null,
      id: "1640103190621",
    };
    nock(this.url.origin).post("/").once().reply(200, res);
    const balances = await this.rpc.getBalances();
    expect(balances).to.be.not.empty;
    expect(balances.result.mine.trusted).to.be.equal(res.result.mine.trusted);
    expect(balances.error).to.be.null;
  }

  @test
  async getTokenBalance() {
    const res = {
      result: "7.74892000",
      error: null,
      id: "1640103454292",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const tokenBalance = await this.rpc.getTokenBalance(
      "3c76244790d45eef410f001d05ee5a5527f42b16",
      "TSy3YBFebUV79oZ1ijAzEEj8ULoV6GZnEQ"
    );
    expect(tokenBalance).to.be.not.empty;
    expect(tokenBalance.result).to.be.equal(res.result);
    expect(tokenBalance.error).to.be.null;
  }

  @test
  async getAddressBalance() {
    const res = {
      result: {
        balance: 10669362215808,
        received: 27522433334959,
        immature: 0,
      },
      error: null,
      id: "1640141214851",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const addressBalance = await this.rpc.getAddressBalance(
      "TSy3YBFebUV79oZ1ijAzEEj8ULoV6GZnEQ"
    );
    expect(addressBalance).to.be.not.empty;
    expect(addressBalance.result.balance).to.be.equal(res.result.balance);
    expect(addressBalance.error).to.be.null;
  }

  @test
  async getRawTransaction() {
    const res = {
      result:
        "02000000013ec8f8e877c518d398c8168afbb79c7ec3e3a5f90c5499d80e065a89ce83be75000000006a473044022076c77e667003341eb31fea85ca7ba4234d78d729be39ec79c1f14ed67ef7f41302201b8e9cdc91d71e9631479552c37c9cd6d6b9412c65272cf990ca2812c037113b0121034467f99fed1529e8cd3a556f0d6c1b8339e757fffe248e91b82d21b031b4c47ffeffffff020000000000000000e9010114ba723d15e07f168e7797a9dce0bec0ee2f3838654c6b6a47304402201ad27c721381f4721956acc7e36affd4eeb844aa6e756daff79122510a2946890220744c1d35a1fe1053cd883b98b0acf42c3046ab0c60bcc706df11a5417df21a690121034467f99fed1529e8cd3a556f0d6c1b8339e757fffe248e91b82d21b031b4c47fc401040499999919012844a9059cbb000000000000000000000000d70fcf2b7fd2aa68e0a97ecf38b6f4133d66613200000000000000000000000000000000000000000000000000000000000003e8143c76244790d45eef410f001d05ee5a5527f42b16c2f01597440f0000001976a914ba723d15e07f168e7797a9dce0bec0ee2f38386588ac00000000",
      error: null,
      id: "1640141576217",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const rawTransaction = await this.rpc.getRawTransaction(
      "9706f22960c8055771cdfe796e377c84bb22395e9366fc6bdeb67b50a9dd9b5a"
    );
    expect(rawTransaction).to.be.not.empty;
    expect(rawTransaction.result).to.be.equal(res.result);
    expect(rawTransaction.error).to.be.null;
  }

  @test
  async getTransactionReceipt() {
    const res = {
      result: [
        {
          blockHash:
            "2dfbf41ba51dd58a914f85580d3712268dd76386f5bceff11b1460759cf587d9",
          blockNumber: 47387,
          transactionHash:
            "9706f22960c8055771cdfe796e377c84bb22395e9366fc6bdeb67b50a9dd9b5a",
          transactionIndex: 2,
          outputIndex: 0,
          from: "ba723d15e07f168e7797a9dce0bec0ee2f383865",
          to: "3c76244790d45eef410f001d05ee5a5527f42b16",
          cumulativeGasUsed: 72158,
          gasUsed: 36079,
          contractAddress: "3c76244790d45eef410f001d05ee5a5527f42b16",
          excepted: "None",
          exceptedMessage: "",
          bloom:
            "00000000000000000200000000000000000000008000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000002000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000001000000000000080000000000000000000000000000000000000000000000010000000000000000000400000000000000000000000000000000000000000000000000002000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          stateRoot:
            "39ee5fe2bb0eb06574d15b443b6bf81acec79d2d2480f3db69b6ccf845830770",
          utxoRoot:
            "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
          log: [Array],
        },
      ],
      error: null,
      id: "1640141677768",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const transactionReceipt = await this.rpc.getTransactionReceipt(
      "9706f22960c8055771cdfe796e377c84bb22395e9366fc6bdeb67b50a9dd9b5a"
    );
    expect(transactionReceipt).to.be.not.empty;
    expect(transactionReceipt.result[0].blockHash).to.be.equal(
      res.result[0].blockHash
    );
    expect(transactionReceipt.error).to.be.null;
  }

  @test
  async decodeRawTransaction() {
    const res = {
      result: {
        txid: "9706f22960c8055771cdfe796e377c84bb22395e9366fc6bdeb67b50a9dd9b5a",
        hash: "9706f22960c8055771cdfe796e377c84bb22395e9366fc6bdeb67b50a9dd9b5a",
        version: 2,
        size: 433,
        vsize: 433,
        weight: 1732,
        locktime: 0,
        vin: [[Object]],
        vout: [[Object], [Object]],
      },
      error: null,
      id: "1640141995519",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const transaction = await this.rpc.decodeRawTransaction(
      "02000000013ec8f8e877c518d398c8168afbb79c7ec3e3a5f90c5499d80e065a89ce83be75000000006a473044022076c77e667003341eb31fea85ca7ba4234d78d729be39ec79c1f14ed67ef7f41302201b8e9cdc91d71e9631479552c37c9cd6d6b9412c65272cf990ca2812c037113b0121034467f99fed1529e8cd3a556f0d6c1b8339e757fffe248e91b82d21b031b4c47ffeffffff020000000000000000e9010114ba723d15e07f168e7797a9dce0bec0ee2f3838654c6b6a47304402201ad27c721381f4721956acc7e36affd4eeb844aa6e756daff79122510a2946890220744c1d35a1fe1053cd883b98b0acf42c3046ab0c60bcc706df11a5417df21a690121034467f99fed1529e8cd3a556f0d6c1b8339e757fffe248e91b82d21b031b4c47fc401040499999919012844a9059cbb000000000000000000000000d70fcf2b7fd2aa68e0a97ecf38b6f4133d66613200000000000000000000000000000000000000000000000000000000000003e8143c76244790d45eef410f001d05ee5a5527f42b16c2f01597440f0000001976a914ba723d15e07f168e7797a9dce0bec0ee2f38386588ac00000000"
    );
    expect(transaction).to.be.not.empty;
    expect(transaction.result.txid).to.be.equal(res.result.txid);
    expect(transaction.error).to.be.null;
  }

  @test
  async fromHexAddress() {
    const res = {
      result: "TVaMDkPv2HAi5gNbcVARi5CadsaF9gada9",
      error: null,
      id: "1640142208148",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const address = await this.rpc.fromHexAddress(
      "D70FCF2b7FD2AA68E0A97EcF38b6f4133d666132"
    );
    expect(address).to.be.not.empty;
    expect(address.result).to.be.equal(res.result);
    expect(address.error).to.be.null;
  }

  @test
  async getHexAddress() {
    const res = {
      result: "d70fcf2b7fd2aa68e0a97ecf38b6f4133d666132",
      error: null,
      id: "1640142293879",
    };

    nock(this.url.origin).post("/").once().reply(200, res);
    const hexAddress = await this.rpc.getHexAddress(
      "TVaMDkPv2HAi5gNbcVARi5CadsaF9gada9"
    );
    expect(hexAddress).to.be.not.empty;
    expect(hexAddress.result).to.be.equal(res.result);
    expect(hexAddress.error).to.be.null;
  }
}
