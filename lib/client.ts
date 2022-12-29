import { Account } from "./accounts/account";
import { RPCClient } from "./rpc";
import { Transaction } from "./transaction";
import * as _ from "lodash";
import { TxOptions, ContractOptions } from "./tx_options";
import * as fvmcore from "fvmcore-lib";
import Web3 from "web3";
import { Contract } from "./contract";
import { Decimal } from "decimal.js";
import { TokenBalance } from "./types";

interface OutputURI {
  address: string;
  amount: number;
  message: string;
  label: string;
  contractAddress: string;
  amountToken: bigint;
}

/**
 * Contain main logic to interact with chain and do operations
 */
export class Client {
  rpcClient: RPCClient;
  web3: Web3;

  /**
   * Client constructor
   * @param url - Janus URL
   */
  constructor(url: string) {
    this.rpcClient = new RPCClient(url);
    this.web3 = new Web3(url);
  }

  async buildAndSend(
    tx: Transaction,
    froms: Account[],
    options?: TxOptions & ContractOptions
  ): Promise<string> {
    const addresses = froms.map((from) => from.address().toString());
    const utxos = options?.utxos || (await this.getUtxos(...addresses));
    if (options?.change) {
      tx.change(options.change);
    }
    if (options?.feePerKb) {
      tx.feePerKb(options.feePerKb);
    }
    tx.build(froms, utxos);

    return this.sendTransaction(tx, options?.unsafeSerialize);
  }

  /**
   * Get balance of specific address
   * e.g. client.getBalance("TUU94f2PAjH5j3cjmmVxBCQYBcvWwfbJ8F")
   *
   * @param address - base58 address to query
   * @returns - FVM balance of the address as satoshi unit e.g. 100000000 which is equals to 1 FVM
   */
  public async getBalance(address: string): Promise<number> {
    return this.rpcClient.getAddressBalance(address).then((balances) => {
      return balances.result.balance;
    });
  }

  /**
   * Get token balance of specific address
   * e.g. client.getTokenBalance(
   *  "3c76244790d45eef410f001d05ee5a5527f42b16",
   *  "TSy3YBFebUV79oZ1ijAzEEj8ULoV6GZnEQ"
   * )
   *
   * @param token - address of FRC20 token
   * @param address - address to query price
   * @returns balance in smallest unit and decimals e.g.
   *  { balance: 100000000, decimals: 9 } represents 1 token of a 9 decimals token
   */
  public async getTokenBalance(
    token: string,
    address: string
  ): Promise<TokenBalance> {
    const decimals: number = await this.rpcClient
      .getTokenDecimals(token)
      .then((decimalsResult) => decimalsResult.result);
    const multiplier = new Decimal(10).pow(decimals);

    return this.rpcClient
      .getTokenBalance(token, address)
      .then((tokenBalance) => {
        return {
          balance: BigInt(
            new Decimal(tokenBalance.result).mul(multiplier).toFixed()
          ),
          decimals,
        };
      });
  }

  /**
   * Get utxos of given addresses
   *
   * @param addresses - base58 addresses e.g.
   *  client.getUtxos("TUrdM4Sse33qUvmqrbcMer4vrKxaUPhHTe", "TSiv5vySgcar8Dp3uiWmEdEbggFVC577vr")
   * @returns - Utxos
   */
  public async getUtxos(...addresses: string[]): Promise<
    {
      address: string;
      txid: string;
      outputIndex: number;
      script: string;
      satoshis: number;
      height: number;
    }[]
  > {
    return this.rpcClient.getAddressUtxos(addresses).then((r) => r.result);
  }

  /**
   * To send valid transaction
   *
   * @param tx - signed transaction
   * @param unsafeSerialize - allow unsafe serialization
   * @returns transaction id
   */
  public async sendTransaction(
    tx: Transaction,
    unsafeSerialize: boolean = false,
    maxFeeRate?: number
  ) {
    if (!maxFeeRate) {
      maxFeeRate = 0;
    }
    return this.sendRawTransaction(tx.serialize(unsafeSerialize), maxFeeRate);
  }

  /**
   * To send valid raw transaction
   *
   * @param rawTransaction - raw transaction as hex with or without prefix 0x
   * @returns transaction id
   */
  public async sendRawTransaction(
    rawTransaction: string,
    maxFeeRate?: number
  ): Promise<string> {
    rawTransaction = rawTransaction.replace("0x", "");
    const response = await this.rpcClient.sendRawTransaction(
      rawTransaction,
      maxFeeRate
    );
    if (response.result) {
      return response.result;
    }

    throw Error(`Fail to send raw transaction ${JSON.stringify(response)}`);
  }

  /**
   * To send funds to addresses
   *
   * @param account - send from
   * @param dests - addresses and amounts to send e.g. [{ to: "TSiv5vySgcar8Dp3uiWmEdEbggFVC577vr", value: 1e8 }]
   * @param options - allow user to specify options for the transaction
   *  - feePerKb - number
   *  - change - address object
   *  - unsafeSerialize - boolean
   *  - utxos - array of utxo
   * @returns transaction id
   */
  public async sendFrom(
    account: Account,
    dests: { to: string; value: number }[],
    options?: TxOptions
  ): Promise<string> {
    const from = account.address();
    const tx = new Transaction();

    for (const { to, value } of dests) {
      tx.to(to, value);
    }

    return this.buildAndSend(tx, [account], options);
  }

  /**
   * To send FRC20 token to an addresses
   *
   * @param account - send from
   * @param token - FRC20 token address
   * @param to - send to
   * @param value - value to send as smallest unit of the token e.g. 1 with 9 decimals token mean 0.000000001
   * @param options - allow user to specify options for the transaction
   *  - feePerKb - satoshis per kb
   *  - change - address object
   *  - unsafeSerialize - boolean to allowe unchecked serialization
   *  - utxos - array of utxo
   *  - gasLimit - gas limit of contract calling
   *  - gasPrice - gas price in sathoshis
   * @returns transaction id
   */
  public async tokenTransfer(
    account: Account,
    token: string,
    to: string,
    value: bigint,
    options?: TxOptions & ContractOptions
  ): Promise<string> {
    const from = account.hex_address();
    const tx = new Transaction();
    token = token.replace("0x", "");

    const gasPrice = options?.gasPrice || 40;
    let gasLimit = options?.gasLimit;
    if (gasLimit && gasLimit < 22000) {
      throw new Error("gas limit lower than bound 22000");
    }

    const hexToAddress = "0x" + (await this.rpcClient.getHexAddress(to)).result;

    const calldata = this.web3.eth.abi
      .encodeFunctionCall(
        {
          inputs: [
            {
              internalType: "address",
              name: "receiver",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "numTokens",
              type: "uint256",
            },
          ],
          name: "transfer",
          outputs: [
            {
              internalType: "bool",
              name: "",
              type: "bool",
            },
          ],
          stateMutability: "nonpayable",
          type: "function",
        },
        [hexToAddress, value.toString()]
      )
      .replace("0x", "");

    try {
      gasLimit = await this.estimateFee(token, calldata, from);
    } catch (e) {
      console.warn(`Fail to estimate gas ${e}`);
      gasLimit = 22000;
    }
    tx.call(calldata, gasPrice, gasLimit, token);
    console.log(gasLimit);

    return this.buildAndSend(tx, [account], options);
  }

  /**
   * Creates a new contract instance with all its methods defined in its json interface object.
   *
   * @param jsonInterface - The json interface for the contract to instantiate
   * @param address - The address of the smart contract to call.
   * @returns Contract instant
   */
  public get Contract(): typeof Contract {
    const client = this;
    // tslint:disable-next-line: max-classes-per-file
    return class extends Contract {
      client: Client;
      constructor(jsonInterface: any[], address: string = "") {
        super(jsonInterface, address);
        this.client = client;
      }
    };
  }

  /**
   * To estimate fee
   * @param contract - contract address
   * @param data - data to call
   * @param sender - (optional) sender address
   * @returns estimated gas or throw error if error
   */
  public async estimateFee(
    contract: string,
    data: string,
    sender?: string
  ): Promise<number> {
    return this.rpcClient
      .callContract(contract, data, sender)
      .then((r) => {
        if (r.error) {
          throw new Error(JSON.stringify(r.error));
        }

        return r.result.transactionReceipt.gasUsed;
      })
      .catch((e) => {
        throw new Error(`Fail to estimate gas fee ${e}`);
      });
  }

  /**
   * Creating a URI for sharing a payment request.
   *
   * @param address - send to
   * @param amount - Number of amount to be paid
   * @param message - Used to provide wallet software with the recipient’s name.
   * @param label - Used to describe the payment request to the spender.
   * @param contractAddress - Contract address for send token
   * @returns URI String
   */
  public createURI(
    address: string,
    amount: number = 0,
    message: string = "",
    label: string = "",
    contractAddress: string = "",
    amountToken: bigint = BigInt(0)
  ): string {
    const uri = contractAddress
      ? new fvmcore.URI({
          address,
          amount: new Decimal(amount).toFixed(),
          message,
          label,
          contractAddress,
          amountToken: amountToken.toString(),
        })
      : new fvmcore.URI({
          address,
          amount: new Decimal(amount).toFixed(),
          message,
          label,
        });
    return uri.toString();
  }

  /**
   * Validating and parsing URIs
   * @param uriString - URI String
   * @returns URI Parameters
   */
  public validateURI(uriString: string): OutputURI {
    if (!fvmcore.URI.isValid(uriString)) {
      throw new Error("URI String is invalid!");
    }

    const uri = new fvmcore.URI(uriString);
    return {
      address: uri.address,
      amount: Number(uri.amount || 0),
      message: uri.message,
      label: uri.label,
      contractAddress: uri.extras.contractAddress,
      amountToken: BigInt(uri.extras.amountToken || 0),
    };
  }

  /**
   * Pay to address in URI
   * @param account - send from
   * @param uriString - URI String
   * @param options - allow user to specify options for the transaction
   * @returns transaction id
   */
  public payToURI(
    account: Account,
    uriString: string,
    options?: TxOptions & ContractOptions
  ): Promise<string> {
    const uri = this.validateURI(uriString);
    if (!uri.contractAddress) {
      return this.sendFrom(
        account,
        [
          {
            to: uri.address.toString(),
            value: uri.amount,
          },
        ],
        options
      );
    } else {
      return this.tokenTransfer(
        account,
        uri.contractAddress,
        uri.address.toString(),
        uri.amountToken,
        options
      );
    }
  }

  /**
   * To query transactions by addresses
   *
   * @param addresses - list of addresses to query transactions
   * @param start - start block
   * @param end - end block
   * @returns Transactions that belongs to specificed addresses
   */
  public async getaddresstxs(
    addresses: string[],
    start?: number,
    end?: number
  ): Promise<fvmcore.Transaction[]> {
    const txs: fvmcore.Transaction[] = [];
    const ids = await this.rpcClient.getAddressTxids(addresses, start, end);

    if (ids) {
      for (const id of ids.result) {
        txs.push((await this.rpcClient.getRawTransaction(id, true)).result);
      }
    }
    return txs;
  }
}
