import * as fvmcore from "fvmcore-lib";
import { Account } from "./accounts/account";
import * as _ from "lodash";

export class Transaction {
  saftyParams = {
    maxGasPrice: 10000,
    maxGasLimit: 10 * 1e6,
    maxGas: 10 * 1e8,
  };

  tx: fvmcore.Transaction;
  changed: boolean = false;

  /**
   * To construct transaction
   *
   * @param serialized - Serialize options
   * @param saftyParams - (optional) to override safty parameters
   *  - maxGasPrice - to override gas price (default: 10000)
   *  - maxGasLimit - to override gas limit (default: 10000000)
   *  - maxGas - to override gas (default: 10 * 1e8[10 FVM])
   */
  constructor(
    serialized?: any,
    saftyParams?: {
      maxGasPrice?: number;
      maxGasLimit?: number;
      maxGas?: number;
    }
  ) {
    this.tx = new fvmcore.Transaction(serialized);
    if (saftyParams) {
      saftyParams = _.pickBy(saftyParams, _.identity);
      this.saftyParams = { ...this.saftyParams, ...saftyParams };
    }
  }

  /**
   * To set inputs
   *
   * @param utxos - coins to use
   * @returns transaction
   */
  from(utxos: any): this {
    this.tx.from(utxos);
    return this;
  }

  /**
   * Add an output to send fund to an address
   *
   * @param address - address to send fund to
   * @param amount - amount in smallest unit
   * @returns transaction
   */
  to(address: any, amount: number): this {
    this.tx.to(address, amount);
    return this;
  }

  /**
   * To set change address
   *
   * @param address
   * @returns transaction
   */
  change(address: any): this {
    this.tx.change(address);
    this.changed = true;
    return this;
  }

  /**
   * To set fee as fixed
   *
   * @param amount
   * @returns transaction
   */
  fee(amount: number): this {
    this.tx.fee(amount);
    return this;
  }

  /**
   * To set fee per kb(size of tx)
   *
   * @param amount
   * @returns transaction
   */
  feePerKb(amount: number): this {
    this.tx.feePerKb(amount);
    return this;
  }

  /**
   * Add OP_RETURN
   *
   * @param data
   * @returns transaction
   */
  addData(data: Buffer): this {
    this.tx.addData(data);
    return this;
  }

  /**
   * Add an input
   *
   * @param input
   * @returns transaction
   */
  addInput(input: fvmcore.Transaction.Input): this {
    this.tx.addInput(input);
    return this;
  }

  /**
   * Add an output
   *
   * @param output
   * @returns transaction
   */
  addOutput(output: fvmcore.Transaction.Output): this {
    this.tx.addOutput(output);
    return this;
  }

  /**
   * Add an output to call contract
   *
   * @param calldata
   * @param gasPrice
   * @param gasLimit
   * @param contract
   * @returns transaction
   */
  call(
    calldata: string,
    gasPrice: number,
    gasLimit: number,
    contract?: string
  ): this {
    if (this.saftyParams) {
      if (gasPrice > this.saftyParams.maxGasPrice) {
        throw new Error(
          `Gas price is exceed limit: ${gasPrice} > ${this.saftyParams.maxGasPrice}`
        );
      }

      if (gasLimit > this.saftyParams.maxGasLimit) {
        throw new Error(
          `Gas limit is exceed limit: ${gasLimit} > ${this.saftyParams.maxGasLimit}`
        );
      }

      if (gasPrice * gasLimit > this.saftyParams.maxGas) {
        throw new Error(
          `Gas is exceed limit: ${gasPrice * gasLimit} > ${
            this.saftyParams.maxGas
          }`
        );
      }
    }

    calldata = calldata.replace("0x", "");

    const fvmGasLimit =
      fvmcore.crypto.BN.fromNumber(gasLimit).toScriptNumBuffer();
    const fvmGasPrice =
      fvmcore.crypto.BN.fromNumber(gasPrice).toScriptNumBuffer();

    const script: fvmcore.Scrtipt = new fvmcore.Script();
    if (contract) {
      contract = contract.replace("0x", "");
      script
        .add(Buffer.from("04", "hex"))
        .add(fvmGasLimit)
        .add(fvmGasPrice)
        .add(Buffer.from(calldata, "hex"))
        .add(Buffer.from(contract, "hex"))
        .add("OP_CALL");
    } else {
      script
        .add(Buffer.from("04", "hex"))
        .add(fvmGasLimit)
        .add(fvmGasPrice)
        .add(Buffer.from(calldata, "hex"))
        .add("OP_CREATE");
    }

    this.tx.addOutput(
      new fvmcore.Transaction.Output({
        script,
        satoshis: 0,
      })
    );

    return this;
  }

  getFee(): number {
    return this.tx.getFee();
  }

  serialize(unsafe?: boolean | object): string {
    return this.tx.serialize(unsafe);
  }

  getInputs(): fvmcore.Transaction.Input[] {
    return this.tx.inputs;
  }

  getOutputs(): fvmcore.Transaction.Output[] {
    return this.tx.outputs;
  }

  sign(...accounts: Account[]): this {
    for (const acc of accounts) {
      this.tx.sign(acc.export_privkey());
    }
    return this;
  }

  /**
   * To add inputs to transaction and sign
   *
   * @param froms
   * @param utxos - array of utxos
   * @returns transaction
   */
  build(froms: Account[], utxos?: any[]): this {
    utxos = utxos || [];

    if (!this.changed) {
      this.change(froms[0].address());
    }

    const required = _.sum(this.getOutputs().map((output) => output.satoshis));

    const useds = this.getInputs().map((i) => i.prevTxId.toString("hex"));
    let inputsAmount =
      _.sum(this.getInputs().map((i) => i.output.satoshis)) || 0;
    while (inputsAmount < required + this.getFee()) {
      const utxo = utxos.shift();
      if (!utxo) {
        throw Error("Not enough funds to create transaction");
      }
      const from = froms
        .map((v) => v.address())
        .find((v) => v.toString() === utxo.address);
      if (!from) {
        continue;
      }

      if (useds.find((u) => u === utxo.txid)) {
        continue;
      }
      this.from({
        address: from,
        txId: utxo.txid,
        outputIndex: utxo.outputIndex,
        script: fvmcore.Script.buildPublicKeyHashOut(from).toString(),
        satoshis: Math.round(utxo.satoshis),
      });
      inputsAmount += utxo.satoshis;
    }

    this.sign(...froms);

    return this;
  }
}
