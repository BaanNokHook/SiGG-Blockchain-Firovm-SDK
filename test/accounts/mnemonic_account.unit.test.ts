import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import { MnemonicAccount } from "../../lib/accounts/mnemonic_account";
import { Context } from "../../lib/context";
import { Network } from "../../lib/networks";

@suite
class MnemonicAccountUnitTests {
  context: Context;
  mnemonic: string;

  constructor() {
    this.context = new Context().withNetwork(Network.Regtest);
    this.mnemonic =
      "sand home split purity total soap solar predict talent enroll nut unable";
  }

  @test
  generate() {
    const account = new MnemonicAccount(this.context);

    const privkey = account.export_privkey();
    const wif = account.export_privkey_as_WIF();
    const address = account.address();
    const hexAddress = account.hex_address();

    expect(privkey).to.be.not.empty;
    expect(wif).to.be.not.empty;
    expect(account.export_mnemonic()).to.be.not.empty;
    expect(account.exportable()).to.be.true;
    expect(account.has_mnemonic()).to.be.true;
    expect(address).to.be.not.empty;
    expect(hexAddress).to.be.not.empty;
  }

  @test
  recovery_mnemonic() {
    const wifPrivkeyRegtest =
      "cQmhB4tfXbJ7C1E8pvavAzTgC1PTcnYvnwXwhC1esVuFk5hkVQas";
    const firoAddressRegtest = "TRskDGsnMSH6ZAw9unjQS3Z3yQzjN4Pwxp";
    const hexAddressRegtest = "0xAe7991F092D19e1D4753173AB9f8C9F307C9f542";
    const hexPrivkeyRegtest =
      "5f2ab36d89d20bdd14d65173208872b52913f37eac19dcd6921c72c80b5ecf2a";

    const wifPrivkeyTestnet =
      "URTeJMS65Hpga4WexqGhBbMNkYYEYBug15tuUfJYMfCpYCyTHE8u";
    const firoAddressTestnet = "TRskDGsnMSH6ZAw9unjQS3Z3yQzjN4Pwxp";
    const hexAddressTestnet = "0xAe7991F092D19e1D4753173AB9f8C9F307C9f542";
    const hexPrivkeyTestnet =
      "5f2ab36d89d20bdd14d65173208872b52913f37eac19dcd6921c72c80b5ecf2a";

    const wifPrivkeyMainnet =
      "Y9yAVZhCvvqZKEsZnLQTjd7rQ7j4wcshxAeJTpqwkk8jiVkxfWLM";
    const firoAddressMainnet = "aAHsrSLUhq2XKaASRisXfx7AvPiqQT5h4N";
    const hexAddressMainnet = "0x690aFCaC550E839538dB4Ee81DF9eDE6789437D2";
    const hexPrivkeyMainnet =
      "9b3b209a8157bfa0ea68685d25d096997c432e2e86557692c929b764b60e0ba6";

    const accountRegtest = new MnemonicAccount(this.context, this.mnemonic);
    expect(accountRegtest.export_privkey_as_WIF()).to.equal(wifPrivkeyRegtest);
    expect(accountRegtest.address().toString()).to.equal(firoAddressRegtest);
    expect(accountRegtest.hex_address()).to.equal(hexAddressRegtest);
    expect(accountRegtest.export_privkey()).to.equal(hexPrivkeyRegtest);

    const accountTestnet = new MnemonicAccount(
      this.context.withNetwork(Network.Testnet),
      this.mnemonic
    );
    expect(accountTestnet.export_privkey_as_WIF()).to.equal(wifPrivkeyTestnet);
    expect(accountTestnet.address().toString()).to.equal(firoAddressTestnet);
    expect(accountTestnet.hex_address()).to.equal(hexAddressTestnet);
    expect(accountTestnet.export_privkey()).to.equal(hexPrivkeyTestnet);

    const accountMainnet = new MnemonicAccount(
      this.context.withNetwork(Network.Mainnet),
      this.mnemonic
    );
    expect(accountMainnet.export_privkey_as_WIF()).to.equal(wifPrivkeyMainnet);
    expect(accountMainnet.address().toString()).to.equal(firoAddressMainnet);
    expect(accountMainnet.hex_address()).to.equal(hexAddressMainnet);
    expect(accountMainnet.export_privkey()).to.equal(hexPrivkeyMainnet);
  }

  @test
  recovery_mnemonic_from_index1() {
    const wifPrivkeyRegtest =
      "cTwBQj77yezXzio2HBSvTyowzCNAPDVbkJtbj4xp5pvepYxZmxqt";
    const firoAddressRegtest = "TJLot9Xyw1KFtuEvrtniU9vBzapgzFnYJt";
    const hexAddressRegtest = "0x5bd6Dbc8A1698ED5c89E4439B0f4B1d65A64b237";
    const hexPrivkeyRegtest =
      "bd8f32cfea868a8bfc0dd10df096b792321cc52e6bbe38b76a28fe41ab790892";

    const accountRegtest = new MnemonicAccount(this.context, this.mnemonic, 1);
    expect(accountRegtest.export_privkey_as_WIF()).to.equal(wifPrivkeyRegtest);
    expect(accountRegtest.address().toString()).to.equal(firoAddressRegtest);
    expect(accountRegtest.hex_address()).to.equal(hexAddressRegtest);
    expect(accountRegtest.export_privkey()).to.equal(hexPrivkeyRegtest);
  }

  @test
  recovery_mnemonic_from_hdPath() {
    const hdPath = "m/44'/1'/0'/0/2";
    const accountIndex2 = new MnemonicAccount(this.context, this.mnemonic, 2);
    const accountHDPath = new MnemonicAccount(
      this.context,
      this.mnemonic,
      0,
      hdPath
    );

    expect(accountIndex2.hdPath).to.equal(accountHDPath.hdPath);
    expect(accountIndex2.export_privkey_as_WIF()).to.equal(
      accountHDPath.export_privkey_as_WIF()
    );
    expect(accountIndex2.address().toString()).to.equal(
      accountHDPath.address().toString()
    );
    expect(accountIndex2.hex_address()).to.equal(accountHDPath.hex_address());
    expect(accountIndex2.export_privkey()).to.equal(
      accountHDPath.export_privkey()
    );
  }

  @test
  recovery_invalid_mnemonic() {
    const mnemonic =
      "sand home split purity total soa solar predict talent enroll nut unable";
    expect(() => new MnemonicAccount(this.context, mnemonic)).to.throw("Invalid mnemonic");
  }
}
