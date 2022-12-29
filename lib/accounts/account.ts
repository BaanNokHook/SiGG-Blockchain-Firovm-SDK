import { Address } from "fvmcore-lib";

/**
 * Interface of accounts which should be use to sign transaction
 */
export interface Account {
  export_privkey: () => string;
  export_privkey_as_WIF: () => string;
  export_mnemonic: () => string;
  exportable: () => boolean;
  has_mnemonic: () => boolean;
  address: () => Address;
  hex_address: () => string;
}
