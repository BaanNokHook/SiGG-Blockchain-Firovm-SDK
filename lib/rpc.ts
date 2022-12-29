import _ from "lodash";
import fetch from "node-fetch";

export class RPCClient {
  private url: string;

  /**
   * Construct RPC client
   * @param url - rpc server url
   */
  constructor(url: string) {
    this.url = url;
  }

  public async rpc(method: string, params: any = []) {
    const init = {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: Date.now().toString(),
        jsonrpc: "2.0",
        method,
        params: params ? params : [],
      }),
    };
    const responseTx = await fetch(this.url, init);
    const responseJsonTx = await responseTx.json();
    return responseJsonTx;
  }

  public async getBalances() {
    return this.rpc("getbalances");
  }

  public async getBalance(
    dummy: string = "*",
    minConf: number = 0,
    includeWatchonly: boolean = false,
    avoidReuse: boolean = false
  ) {
    return this.rpc("getbalance", [
      dummy,
      minConf,
      includeWatchonly,
      avoidReuse,
    ]);
  }

  public async getTokenDecimals(contractAddress: string) {
    return this.rpc("frc20decimals", [contractAddress]);
  }

  public async getTokenBalance(contractAddress: string, address: string) {
    return this.rpc("frc20balanceof", [contractAddress, address]);
  }

  public async getBlockChainInfo() {
    return this.rpc("getblockchaininfo");
  }

  public async getBestBlockHash() {
    return this.rpc("getbestblockhash");
  }

  public async getAddressBalance(...addresses: string[]) {
    return this.rpc("getaddressbalance", [{ addresses }]);
  }

  public async getAddressUtxos(
    addresses: string[],
    chainInfo: boolean = false
  ) {
    return this.rpc("getaddressutxos", [{ addresses, chainInfo }]);
  }

  public async getAddressTxids(
    addresses: string[],
    start?: number,
    end?: number
  ) {
    end = end ? end : 2147483647;
    const options = {
      addresses,
      ...(start && { start }),
      ...(start && end && { end }),
    };
    return this.rpc("getaddresstxids", [options]);
  }

  public async fromHexAddress(hexaddress: string) {
    return this.rpc("fromhexaddress", [hexaddress]);
  }

  public async getHexAddress(address: string) {
    return this.rpc("gethexaddress", [address]);
  }

  public async decodeRawTransaction(hexstring: string) {
    return this.rpc("decoderawtransaction", [hexstring]);
  }

  public async sendRawTransaction(hexstring: string, maxFeeRate?: number) {
    const options: any[] = [hexstring];
    if (_.isNumber(maxFeeRate)) {
      options.push(maxFeeRate);
    }
    return this.rpc("sendrawtransaction", options);
  }

  public async getRawTransaction(
    txid: string,
    verbose: boolean = false,
    blockhash: string = ""
  ) {
    return this.rpc(
      "getrawtransaction",
      blockhash ? [txid, verbose, blockhash] : [txid, verbose]
    );
  }

  public async getTransactionReceipt(hash: string) {
    return this.rpc("gettransactionreceipt", [hash]);
  }

  public async getBlock(hex: string) {
    return this.rpc("getblock", [hex]);
  }

  public async getAllowance(
    contractaddress: string,
    addressFrom: string,
    addressTo: string
  ) {
    return this.rpc("frc20allowance", [
      contractaddress,
      addressFrom,
      addressTo,
    ]);
  }

  public async getDecimals(contractaddress: string) {
    return this.rpc("frc20decimals", [contractaddress]);
  }

  public async getListTransactions(
    contractaddress: string,
    addresss: string,
    fromBlock: number = 0,
    minconf: number = 6
  ) {
    return this.rpc("frc20listtransactions", [
      contractaddress,
      addresss,
      fromBlock,
      minconf,
    ]);
  }

  public async getName(contractaddress: string) {
    return this.rpc("frc20name", [contractaddress]);
  }

  public async getSymbol(contractaddress: string) {
    return this.rpc("frc20symbol", [contractaddress]);
  }

  public async getTotalSupply(contractaddress: string) {
    return this.rpc("frc20totalsupply", [contractaddress]);
  }

  public async getBlockCount() {
    return this.rpc("getblockcount");
  }

  public async getBlockHash(height: number) {
    return this.rpc("getblockhash", [height]);
  }

  public async getBlockHeader(blockhash: string, verbose: boolean = true) {
    return this.rpc("getblockheader", [blockhash, verbose]);
  }

  public async callContract(
    contract: string,
    data: string,
    sender?: string,
    gasLimit?: number,
    amount?: number
  ) {
    const args: any[] = [contract, data];
    if (sender) {
      args.push(sender);
    }

    if (gasLimit) {
      if (args.length < 3) {
        args.push("");
      }
      args.push(gasLimit);
    }

    if (amount) {
      if (args.length < 3) {
        args.push("");
      }

      if (args.length < 4) {
        args.push(999999999);
      }

      args.push(amount);
    }
    return this.rpc("callcontract", args);
  }
}
