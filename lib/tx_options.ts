import { Address } from "fvmcore-lib";

export interface TxOptions {
  feePerKb?: number;
  change?: Address;
  unsafeSerialize?: boolean;
  utxos?: any[];
}

export interface ContractOptions {
  gasLimit?: number;
  gasPrice?: number;
}
