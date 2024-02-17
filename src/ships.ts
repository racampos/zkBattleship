import { Field, ZkProgram, verify, Gadgets, Bool, Poseidon, Struct, Provable } from 'o1js';
import { Position } from './utils.js';

// A ship is defined by:
// - the ending position of the ship
// - the direction of the ship (0: horizontal, 1: vertical)
// - the size of the ship (carrier: 5, battleship: 4, cruiser: 3, submarine: 3, destroyer: 2)
class Ship extends Struct({ end: Position, direction: Field, horPattern: Field, verPattern: Field }) {
  constructor(value: { end: Position, direction: Field, horPattern: Field, verPattern: Field }) {
    super(value);
  }

  // Returns a Field representing the occupied slots on the board
  getSlots(): Field {
    return Provable.if(
      this.direction.equals(Field(0)),
      this.horPattern.mul(this.end.getField()),
      this.verPattern.mul(this.end.getField())
    );
  }
}

export class Carrier extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b11111);
    const vp = Field(0b100000000001000000000010000000000100000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp });
  }
}

export class Battleship extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b1111);
    const vp = Field(0b1000000000010000000000100000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp });
  }
}

export class Cruiser extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b111);
    const vp = Field(0b10000000000100000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp });
  }
}

export class Submarine extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b111);
    const vp = Field(0b10000000000100000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp });
  }
}

export class Destroyer extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b11);
    const vp = Field(0b100000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp });
  }
}
