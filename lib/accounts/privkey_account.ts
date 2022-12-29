import { Network } from "../networks";
import { Account } from "./account";
import { PrivateKey, Networks, Address } from "fvmcore-lib";
import { Context } from "../context";
import { NoMnemonicToExportError } from "./error";
import { throws } from "assert";
import { toChecksumAddress } from "web3-utils";

/**
 * Private key account that contains private key and address logic
 */
export class PrivkeyAccount implements Account {
  private network: Network;
  private privkey: PrivateKey;

  /**
   * Constructor of private account
   * @param context - context of the call which we could use specific network via this
   * @param key - private key as hex, if this is not provided the new one would be generated
   */
  constructor(context: Context, key?: string) {
    this.network = context.network;

    if (!key) {
      this.privkey = new PrivateKey(null, this._network);
    } else {
      this.privkey = new PrivateKey(key, this._network);
    }
  }

  get _network(): any {
    switch (this.network) {
      case Network.Testnet:
        return Networks.testnet;
      case Network.Regtest:
        return Networks.regtest;
      default:
        return Networks.mainnet;
    }
  }

  /**
   * Export privkey as hex string
   * @returns - hex string
   */
  public export_privkey() {
    return this.privkey.toBuffer().toString("hex");
  }

  /**
   * Export privkey as WIF format
   * @returns - string of WIF
   */
  public export_privkey_as_WIF() {
    return this.privkey.toWIF();
  }

  /**
   * Get mnemonic
   * @returns - nothing, expection would be throw
   */
  public export_mnemonic() {
    throw new NoMnemonicToExportError();
    return "";
  }

  /**
   * Exportable status
   * @returns - boolean
   */
  public exportable() {
    return true;
  }

  /**
   * Has mnemonic status
   * @returns - boolean
   */
  public has_mnemonic() {
    return false;
  }

  /**
   * Get address
   * @returns - address object
   */
  public address() {
    return Address.fromPublicKey(this.privkey.toPublicKey(), this._network);
  }

  /**
   * Will return the corresponding public key
   * @returns {PublicKey} A public key generated from the private key
   */
  public get_pubkey() {
    return this.privkey.toPublicKey();
  }

  /**
   * Get hex address
   * @returns - string of hex address
   */
  public hex_address() {
    return toChecksumAddress(
      "0x" +
        this.privkey
          .toAddress(this._network)
          .toBuffer()
          .toString("hex")
          .substr(2)
    );
  }
}
