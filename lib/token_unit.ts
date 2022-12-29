import Decimal from "decimal.js";

export class TokenUnit {
  value: Decimal;
  decimals: number;

  /**
   * Token unit converter
   *
   * @param amount - Amount of token e.g. 10 tokens of a FRC20 with any decimals is represent as 1
   * @param decimals - Decimals number of FRC20 token
   */
  constructor(amount: Decimal | string | number, decimals: number) {
    this.value = new Decimal(amount);
    this.decimals = decimals;

    const multiplier = new Decimal(10).pow(decimals);
    this.value = this.value.mul(multiplier);
  }

  /**
   * Convert to smallest unit
   *
   * @returns - smallest unit of token
   */
  toBigInt(): bigint {
    return BigInt(this.value.toFixed());
  }
}
