import { suite, test } from "@testdeck/mocha";
import { expect } from "chai";
import Decimal from "decimal.js";
import { Unit } from "../lib";
import { TokenUnit } from "../lib/token_unit";

describe("Unit", () => {
  it("Token unit", () => {
    const tests: {
      amount: Decimal | string | number;
      decimals: number;
      expected: string;
    }[] = [
      {
        amount: new Decimal("12"),
        decimals: 18,
        expected: "12000000000000000000",
      },
      {
        amount: new Decimal("1.2"),
        decimals: 18,
        expected: "1200000000000000000",
      },
      {
        amount: "1.2",
        decimals: 18,
        expected: "1200000000000000000",
      },
      {
        amount: 1.2,
        decimals: 18,
        expected: "1200000000000000000",
      },
      {
        amount: 9007199254740991,
        decimals: 18,
        expected: "9007199254740991000000000000000000",
      },
    ];

    for (const t of tests) {
      expect(new TokenUnit(t.amount, t.decimals).toBigInt()).to.eq(
        BigInt(t.expected)
      );
    }
  });
  it("FVM unit", () => {
    expect(Unit.fromFVM(1.2).toSatoshis()).to.eq(120000000);
    expect(Unit.fromFVM(1.2).toMilis()).to.eq(1200);
    expect(Unit.fromFVM(21000000).toSatoshis()).to.eq(2100000000000000);

    expect(Unit.fromBits(1.2).toSatoshis()).to.eq(120);
  });
});
