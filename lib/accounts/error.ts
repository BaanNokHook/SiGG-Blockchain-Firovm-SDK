export class NoMnemonicToExportError extends Error {
  constructor() {
    super("No mnemonic to export");
    Object.setPrototypeOf(this, NoMnemonicToExportError.prototype);
  }
}
