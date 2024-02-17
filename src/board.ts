import { Field, ZkProgram, verify, Gadgets, Bool, Poseidon, Struct, Provable } from 'o1js';
import { Carrier } from './ships.js';
import { Position } from './utils.js';


export class Board extends Struct({ 
  carrier: Carrier
 }) {
  constructor(value: { 
    carrier: Carrier
  }) {
    super(value);
  }

  getSlots(): Field {
    return this.carrier.getSlots();
  }

  isOccupied(target: Position): Bool {
    return Gadgets.and(this.getSlots(), target.getField(), 254).equals(Field(0)).not()
  }

  getHash(): Field {
    return Poseidon.hash([this.getSlots()]);
  }
}