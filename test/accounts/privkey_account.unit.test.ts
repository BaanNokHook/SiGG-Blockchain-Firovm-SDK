import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { PrivkeyAccount } from "../../lib/accounts/privkey_account";
import { Context } from "../../lib/context";
import { Network } from "../../lib/networks";
import { NoMnemonicToExportError } from "../../lib/accounts/error";
import { encoding, Networks } from "fvmcore-lib";

@suite
class PrivateKeyAccountUnitTests {
  context: Context;
  constructor() {
    this.context = new Context().withNetwork(Network.Regtest);
  }

  @test
  generate() {
    const context = this.context;
    const account = new PrivkeyAccount(context);

    const privkey = account.export_privkey();
    const wif = account.export_privkey_as_WIF();
    const address = account.address();
    const hex_address = account.hex_address();

    expect(privkey).to.be.not.empty;
    expect(wif).to.be.not.empty;
    expect(() => {
      account.export_mnemonic();
    }).to.throw(NoMnemonicToExportError);
    expect(account.exportable()).to.be.true;
    expect(account.has_mnemonic()).to.be.false;
    expect(address).to.be.not.empty;
    expect(hex_address).to.be.not.empty;

    // hex
    expect(new PrivkeyAccount(context, privkey).address().toString()).to.equal(
      address.toString()
    );
  }

  @test
  recovery_privkey() {
    const hexPrivkey =
      "2b20f3e0b759aa353a20db5f29f081d946b77f3cb7f7fa80865c9fecc2846189";
    const wifPrivkey = "cP2YAtVuis5cuQgtaZcePEyQ3MemRjT85U6UoMbMXkQzGK89feAi";
    const hexAddress = "0xcaEB0a2c9C12a4adAe8876B121EEF6451BDc710f";
    const firoAddress = "TUU94f2PAjH5j3cjmmVxBCQYBcvWwfbJ8F";
    const context = this.context;

    for (const priv of [hexPrivkey, wifPrivkey]) {
      const account = new PrivkeyAccount(context, priv);
      expect(account.export_privkey()).to.equal(hexPrivkey);
      expect(account.export_privkey_as_WIF()).to.equal(wifPrivkey);
      expect(account.hex_address()).to.equal(hexAddress);
      expect(account.address().toString()).to.equal(firoAddress);

      expect(account.exportable()).to.be.true;
      expect(account.has_mnemonic()).to.be.false;
    }
  }

  @test
  recovery_fromhex() {
    const hexPrivkey =
      "2b20f3e0b759aa353a20db5f29f081d946b77f3cb7f7fa80865c9fecc2846189";

    const regtestAddress = "TUU94f2PAjH5j3cjmmVxBCQYBcvWwfbJ8F";
    const testAddress = "TUU94f2PAjH5j3cjmmVxBCQYBcvWwfbJ8F";
    const mainnetAddress = "aKDPoW6HEo9ydQzDBuANRL2utCJZ1bFvH1";
    const hexAddress = "0xcaEB0a2c9C12a4adAe8876B121EEF6451BDc710f";

    const regtestKey = "cP2YAtVuis5cuQgtaZcePEyQ3MemRjT85U6UoMbMXkQzGK89feAi";
    const testKey = "UPiVJB3LGZcCHTyQiUJRPqs6btoYM8osHcTSaptF1uiZ4SS4NnaM";
    const mainnetKey = "Y6DFbD3peQWdeQJcYNAkJCEGpkprDbb3Mf2haBYcHsZM6iNLR183";

    // recovery from hex
    const recoveryFromHexTests: {
      network: Network;
      address: string;
      privkey: string;
    }[] = [
      {
        network: Network.Regtest,
        address: regtestAddress,
        privkey: regtestKey,
      },
      { network: Network.Testnet, address: testAddress, privkey: testKey },
      {
        network: Network.Mainnet,
        address: mainnetAddress,
        privkey: mainnetKey,
      },
    ];

    recoveryFromHexTests.forEach((x) => {
      const account = new PrivkeyAccount(
        new Context().withNetwork(x.network),
        hexPrivkey
      );

      expect(account.address().toString()).to.equal(x.address);
      expect(account.export_privkey_as_WIF()).to.equal(x.privkey);
      expect(account.hex_address()).to.equal(hexAddress);
    });
  }

  @test
  recovery_from_wif() {
    const hexPrivkey =
      "2b20f3e0b759aa353a20db5f29f081d946b77f3cb7f7fa80865c9fecc2846189";

    const regtestAddress = "TUU94f2PAjH5j3cjmmVxBCQYBcvWwfbJ8F";
    const testAddress = "TUU94f2PAjH5j3cjmmVxBCQYBcvWwfbJ8F";
    const mainnetAddress = "aKDPoW6HEo9ydQzDBuANRL2utCJZ1bFvH1";
    const hexAddress = "0xcaEB0a2c9C12a4adAe8876B121EEF6451BDc710f";

    const regtestKey = "cP2YAtVuis5cuQgtaZcePEyQ3MemRjT85U6UoMbMXkQzGK89feAi";
    const testKey = "UPiVJB3LGZcCHTyQiUJRPqs6btoYM8osHcTSaptF1uiZ4SS4NnaM";
    const mainnetKey = "Y6DFbD3peQWdeQJcYNAkJCEGpkprDbb3Mf2haBYcHsZM6iNLR183";

    // recovery from wif
    const recoveryFromHexTests: {
      network: Network;
      address: string;
      privkey: string;
    }[] = [
      {
        network: Network.Regtest,
        address: regtestAddress,
        privkey: regtestKey,
      },
      { network: Network.Testnet, address: testAddress, privkey: testKey },
      {
        network: Network.Mainnet,
        address: mainnetAddress,
        privkey: mainnetKey,
      },
    ];

    recoveryFromHexTests.forEach((x) => {
      const account = new PrivkeyAccount(
        new Context().withNetwork(x.network),
        x.privkey
      );

      expect(account.address().toString()).to.equal(x.address);
      expect(account.hex_address()).to.equal(hexAddress);
      expect(account.export_privkey_as_WIF()).to.equal(x.privkey);
      expect(account.export_privkey()).to.equal(hexPrivkey);
    });
  }
}
