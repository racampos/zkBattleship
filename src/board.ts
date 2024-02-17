import { Field, ZkProgram, verify, Gadgets, Bool, Poseidon, Struct, Provable } from 'o1js';
import { Carrier, Battleship, Cruiser, Submarine, Destroyer } from './ships.js';
import { Position } from './utils.js';


export class Board extends Struct({ 
  carrier: Carrier,
  battleship: Battleship,
  cruiser: Cruiser,
  submarine: Submarine,
  destroyer: Destroyer
 }) {
  constructor(value: { 
    carrier: Carrier,
    battleship: Battleship,
    cruiser: Cruiser,
    submarine: Submarine,
    destroyer: Destroyer
  }) {
    super(value);
  }

  getSlots(): Field {
    return this.carrier.getSlots().add(this.battleship.getSlots()).add(this.cruiser.getSlots()).add(this.submarine.getSlots()).add(this.destroyer.getSlots());
  }

  isOccupied(target: Position): Bool {
    return Gadgets.and(this.getSlots(), target.getField(), 254).equals(Field(0)).not()
  }

  getHash(): Field {
    return Poseidon.hash([this.getSlots()]);
  }
}