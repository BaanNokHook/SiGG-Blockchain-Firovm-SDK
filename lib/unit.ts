import * as fvmcore from "fvmcore-lib";

export class Unit {
  unit: fvmcore.Unit;

  /**
   * Native unit converter
   *
   * @param amount
   * @param unitPreference - BTC | mBTC | bits | satoshis
   */
  constructor(amount: number, unitPreference: string) {
    this.unit = new fvmcore.Unit(amount, unitPreference);
  }

  static fromBTC(amount: number): Unit {
    return new Unit(amount, "BTC");
  }

  static fromFVM(amount: number): Unit {
    return new Unit(amount, "BTC");
  }

  static fromMilis(amount: number): Unit {
    return new Unit(amount, "mBTC");
  }

  static fromBits(amount: number): Unit {
    return new Unit(amount, "bits");
  }

  static fromSatoshis(amount: number): Unit {
    return new Unit(amount, "satoshis");
  }

  toBTC(): number {
    return this.unit.toBTC();
  }

  toFVM(): number {
    return this.unit.toBTC();
  }

  toMilis(): number {
    return this.unit.toMilis();
  }

  toBits(): number {
    return this.unit.toBits();
  }

  toSatoshis(): number {
    return this.unit.toSatoshis();
  }
}
