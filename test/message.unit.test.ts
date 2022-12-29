import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { PrivkeyAccount } from "../lib/accounts/privkey_account";
import { Context } from "../lib/context";
import { Message } from "../lib/message";
import { Network } from "../lib/networks";
import { utils, Signature } from "@noble/secp256k1";
import { MnemonicAccount } from "../lib/accounts/mnemonic_account";

const hex = utils.bytesToHex;

@suite
class MessageUnitTests {
  context: Context;
  constructor() {
    this.context = new Context().withNetwork(Network.Regtest);
  }

  @test
  async sign_message() {
    const context = this.context;
    const message = new Message("hello");
    const hexPrivkey =
      "2b20f3e0b759aa353a20db5f29f081d946b77f3cb7f7fa80865c9fecc2846189";
    const account = new PrivkeyAccount(context, hexPrivkey);
    const signature = await message.sign(account);

    expect(hex(signature)).to.be.equal(
      "eea2f29b4f5da146dd4e2b0a6e6357abcc99667fad4f1f1a0b5e223709a8fb8021e36208e4b05750ac40be2e77bb9080d47c727e559508ca005a1c6f6d6d9387"
    );
  }

  @test
  async verify_message() {
    const context = this.context;
    const message = new Message("hello");
    const account = new PrivkeyAccount(context);
    const signature = await message.sign(account);
    const verified = await message.verify(
      signature,
      account.get_pubkey().toString()
    );

    expect(signature).to.be.not.empty;
    expect(verified).to.be.true;
  }

  @test
  async verify_message_with_mnemonic() {
    const message = new Message("hello");
    const mnemonic =
      "sand home split purity total soap solar predict talent enroll nut unable";
    const account = new MnemonicAccount(this.context, mnemonic);
    const pubKey = account.get_pubkey().toString();
    const signature = await message.sign(account);
    const verified = await message.verify(signature, pubKey);

    expect(pubKey).to.be.equal(
      "0266e01a4fddfbbe8f2e65fca56726587794eff69a67102b29c0e765bbdb7aea66"
    );
    expect(signature).to.be.not.empty;
    expect(verified).to.be.true;
  }

  @test
  async verify_message_fail() {
    const context = this.context;
    const message = new Message("hello");
    const account1 = new PrivkeyAccount(context);
    const account2 = new PrivkeyAccount(context);
    const signature = await message.sign(account1);
    const verified = await message.verify(
      signature,
      account2.get_pubkey().toString()
    );

    expect(signature).to.be.not.empty;
    expect(verified).to.be.false;
  }

  @test
  async invalid_signature() {
    try {
      new Signature(BigInt(0), BigInt(1));
    } catch (error) {
      expect((<Error>error).message).to.be.equal(
        "Invalid Signature: r must be 0 < r < n"
      );
    }
    try {
      new Signature(BigInt(1), BigInt(0));
    } catch (error) {
      expect((<Error>error).message).to.be.equal(
        "Invalid Signature: s must be 0 < s < n"
      );
    }
  }
}
