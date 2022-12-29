import { Account } from "./accounts/account";
import { Contract } from "./contract";
import { Transaction } from "./transaction";

// tslint:disable-next-line: no-var-requires
const Web3EthAbi = require("web3-eth-abi");

interface Input {
  internalType: string;
  name: string;
  type: string;
}

interface Output {
  internalType: string;
  name: string;
  type: string;
}

interface JSONInterface {
  inputs: Input[];
  name: string;
  outputs: Output[];
  stateMutability: string;
  type: string;
}

interface CallOptions {
  from?: string;
  gas?: number;
  amount?: number;
}

interface SendOptions {
  value?: number;
  gas?: number;
  gasPrice?: number;
  from: Account;
}

/**
 * Creates a transaction object for that method, which then can be called, send.
 * The methods of this smart contract are available through: `myContract.methods.myMethod(123)`
 */
export class Method {
  args: any[];
  name: string;
  contract: any;

  /**
   *
   * @param args - Parameters of any method depend on the smart contracts methods
   * @param name - Name of method.
   * @param contract - Contract instant of method.
   *
   */
  constructor(args: any[], name: string, contract) {
    this.args = args;
    this.name = name;
    this.contract = contract;
  }

  /**
   * Encodes the ABI for this method.
   *
   * @returns The encoded ABI byte code to send via a transaction or call.
   */
  public encodeABI(): string {
    if (this.name === "constructor") {
      return this.contract.contractBytecode;
    }
    if (this.args.length === 0) {
      return this.encodeFunctionSignature(this.contract.jsonABI[this.name]);
    } else {
      return this.encodeFunctionCall(
        this.contract.jsonABI[this.name],
        this.args
      );
    }
  }

  /**
   * Get array of JSON interface outputs
   *
   * @returns An array with types
   */
  public getDecodeParameters(): string[] {
    const decodeParameters: string[] = [];
    for (const param of this.contract.jsonABI[this.name].outputs) {
      decodeParameters.push(param.type);
    }
    return decodeParameters;
  }

  /**
   * Get array of JSON interface inputs
   *
   * @returns An array with types
   */
  public getEncodeParameters(): string[] {
    const encodeParameters: string[] = [];
    for (const param of this.contract.jsonABI[this.name].inputs) {
      encodeParameters.push(param.type);
    }
    return encodeParameters;
  }

  /**
   * Encodes a function parameters based on its JSON interface object.
   *
   * @returns The ABI encoded parameters.
   */
  public encodeParameters(typesArray: string[], parameters: any[]): string {
    return Web3EthAbi.encodeParameters(typesArray, parameters);
  }

  /**
   * Encodes the function name to its ABI signature, which are the first 4 bytes of the sha3 hash of the function name including types.
   *
   * @param obj - JSON interface object of the function.
   * @returns The ABI signature of the function.
   */
  public encodeFunctionSignature(obj: JSONInterface): string {
    return Web3EthAbi.encodeFunctionSignature(obj);
  }

  /**
   * Encodes a function call using its JSON interface object and given parameters.
   *
   * @param jsonInterface - JSON interface object of the function.
   * @param parameters - Array: The parameters to encode.
   * @returns The ABI encoded function call. Means function signature + parameters.
   */
  public encodeFunctionCall(jsonInterface, parameters): string {
    return Web3EthAbi.encodeFunctionCall(jsonInterface, parameters);
  }

  /**
   * Decodes ABI encoded parameters to its JavaScript types.
   *
   * @param typesArray - An array with types or a JSON interface outputs array.
   * @param hexString - String: The ABI byte code to decode.
   * @returns The result object containing the decoded parameters.
   */
  public decodeParameters(typesArray, hexString): any {
    return Web3EthAbi.decodeParameters(typesArray, hexString);
  }

  /**
   * Will call a “constant” method and execute its smart contract method in the EVM without sending any transaction.
   *
   * @param options
   * - from: The address the call “transaction” should be made from.
   * - gas: The gas limit for executing the contract.
   * - amount: The amount in FVM to send.
   * @returns The result object containing the decoded parameters.
   */
  public async call(options: CallOptions = {}): Promise<any> {
    const input = this.encodeABI();
    const decodeParameters = this.getDecodeParameters();

    const result = await this.contract.client.rpcClient.callContract(
      this.contract.address,
      input.replace("0x", ""),
      options.from || "",
      options.gas || 0,
      options.amount || 0
    );

    const output = result.result.executionResult.output;
    return this.decodeParameters(decodeParameters, output);
  }

  /**
   * Will send a transaction to the smart contract and execute its method.
   *
   * @param options
   * - value: Value in FVM to send with the call.
   * - gas: The gas limit for the transaction.
   * - gasPrice: The gas price for the transaction.
   * - from: The firovm address that will be used to create the contract.
   * @returns The callback will return the 32 bytes transaction hash.
   */
  public async send(options: SendOptions): Promise<string> {
    const tx = new Transaction();
    const gasPrice = options?.gasPrice || 40;
    const gas = options?.gas || 10000000;
    const input = this.encodeABI();

    if (this.contract.address !== "") {
      const contractAddress =
        await this.contract.client.rpcClient.fromHexAddress(
          this.contract.address
        );
      const toAddress = contractAddress.result;

      if (options.value) {
        tx.to(toAddress, options.value);
      }
      tx.call(input, gasPrice, gas, this.contract.address);
    } else {
      tx.call(input, gasPrice, gas);
    }

    return await this.contract.client.buildAndSend(tx, [options.from]);
  }
}
