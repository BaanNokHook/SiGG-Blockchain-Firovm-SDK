import { Context } from "../context";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import * as bip32 from "bip32";
import { Network } from "../networks";
import { PrivkeyAccount } from "./privkey_account";

export const derivePath = ({
  purpose = "44",
  coinType = "88",
  account = "0",
  change = "0",
  index = "0",
}): string => {
  return `m/${purpose}'/${coinType}'/${account}'/${change}/${index}`;
};

/**
 * Account as mnemonic
 */
export class MnemonicAccount extends PrivkeyAccount {
  mnemonic: string;
  hdPath: string;

  /**
   * Construct a new mnemonic account
   * @param context - context of the call which we could use specific network via this
   * @param _mnemonic - mnemonic to be recovered, if we isn't provided then new mnemonic would be generated
   * @param _accountIndex - index of account to derived
   * @param _hdPath - instead of specific account index we could specific full path instead
   */
  constructor(
    context: Context,
    _mnemonic?: string,
    _accountIndex?: string | number,
    _hdPath?: string
  ) {
    if (!_hdPath) {
      const coinType = context.network === Network.Mainnet ? "88" : "1";
      const index = _accountIndex?.toString() || "0";
      _hdPath = derivePath({ coinType, index });
    }

    _mnemonic = _mnemonic ? _mnemonic : generateMnemonic();
    const valid = validateMnemonic(_mnemonic);
    if (!valid) {
      throw new Error("Invalid mnemonic");
    }
    const seed = mnemonicToSeedSync(_mnemonic);
    const node = bip32.fromSeed(seed);
    const child = node.derivePath(_hdPath);
    super(context, child.privateKey?.toString("hex"));

    this.mnemonic = _mnemonic;
    this.hdPath = _hdPath;
  }

  /**
   * Get mnemonic
   * @returns - string of mnemonic
   */
  public export_mnemonic(): string {
    return this.mnemonic;
  }

  /**
   * Get exportable status
   * @returns - boolean
   */
  public exportable(): boolean {
    return true;
  }

  /**
   * Get status of mnemonic
   * @returns - boolean
   */
  public has_mnemonic(): boolean {
    return true;
  }
}
