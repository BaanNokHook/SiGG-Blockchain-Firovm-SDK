import { sign, Signature, utils, verify } from "@noble/secp256k1";
import { PrivkeyAccount } from "./accounts/privkey_account";

export class Message {
  message: Buffer;

  /**
   *
   * @param message - The message to sign or verify
   *
   */
  constructor(message: string | Buffer) {
    this.message = Buffer.from(message);
  }

  /**
   * Sign the message with the given account
   *
   * @param account - The account to sign the message with
   * @returns The signature of the message
   */
  async sign(account: PrivkeyAccount): Promise<Uint8Array> {
    const messageHash = await this.getMessageHash();
    const opts = { der: false };
    return await sign(messageHash, account.export_privkey(), opts);
  }

  /**
   * Verify the message with the given signature and public key
   *
   * @param signature - The signature of the message
   * @param pubkey - The public key of the account that signed the message
   * @returns Whether the message was verified
   */
  async verify(
    signature: Uint8Array | string | Signature,
    pubKey: Uint8Array | string
  ): Promise<boolean> {
    const messageHash = await this.getMessageHash();
    return verify(signature, messageHash, pubKey);
  }

  /**
   * Get the message hash of the message
   *
   * @returns The message hash of the message
   */
  async getMessageHash(): Promise<Uint8Array> {
    return await utils.sha256(Uint8Array.from(this.message));
  }

  /**
   * Get the message type string
   *
   * @returns The message string
   *
   */
  getMessage(): string {
    return this.message.toString();
  }
}
