import { Network } from "./networks";

export class Context {
  private _network: Network;

  constructor() {
    this._network = Network.Mainnet;
  }

  /**
   * Update network for context
   *
   * @param network network to set
   * @returns cloned context with updated network
   */
  public withNetwork(network: Network): Context {
    this._network = network;
    return this;
  }

  get network(): Network {
    return this._network;
  }
}
