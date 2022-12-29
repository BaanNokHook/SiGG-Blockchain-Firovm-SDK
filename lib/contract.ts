import { Method } from "./method";

/**
 * The Contract object makes it easy to interact with smart contracts on the FVM.
 */
export class Contract {
  jsonInterface: any[];
  address: string;
  methods: any;
  jsonABI: any;
  method: Method;
  contractBytecode: string;

  /**
   *
   * @param jsonInterface - The json interface for the contract to instantiate
   * @param address - The address of the smart contract to call.
   * @param client - Client instant of method.
   *
   */
  constructor(jsonInterface: any[], address: string = "") {
    this.jsonInterface = jsonInterface;
    this.address = address.replace("0x", "");
    this.methods = {};
    this.method = new Method([], "default", this);
    this.jsonABI = {};
    this.contractBytecode = "";

    this.jsonInterface.forEach((obj) => {
      if (obj.type === "function") {
        this.methods[obj.name] = (...args) => {
          return new Method(args, this.methods[obj.name].name, this);
        };
        this.jsonABI[obj.name] = obj;
        Object.defineProperty(this.methods[obj.name], "name", {
          value: obj.name,
          configurable: true,
        });
      } else if (obj.type === "constructor") {
        this.methods.constructor = (...args) => {
          return new Method(args, "constructor", this);
        };
        this.jsonABI.constructor = obj;
      } else {
        this.methods[obj.type] = obj.type;
      }
    });
  }

  public deploy(data: string, args: any[] = []) {
    const constructorMethod = this.methods.constructor(...args);
    const parameters = constructorMethod.getEncodeParameters();
    let encodeParams = "";

    if (args.length > 0) {
      encodeParams = constructorMethod.encodeParameters(parameters, args);
    }
    this.contractBytecode =
      data.replace("0x", "") + encodeParams.replace("0x", "");
    return constructorMethod;
  }
}
