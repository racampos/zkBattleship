import { Field, ZkProgram, verify, Gadgets, Bool, Poseidon, Struct, Provable } from 'o1js';
import { Position } from './utils.js';

// A ship is defined by:
// - the ending position of the ship
// - the direction of the ship (0: horizontal, 1: vertical)
// - the pattern of the ship in the horizontal direction
// - the pattern of the ship in the vertical direction
export class Ship extends Struct({ end: Position, direction: Field, horPattern: Field, verPattern: Field, size: Field }) {
  constructor(value: { end: Position, direction: Field, horPattern: Field, verPattern: Field, size: Field }) {
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

  // Returns a null Ship
  static null(): Ship {
    return new Ship({ end: new Position({ x: Field(9), y: Field(9) }), direction: Field(0), horPattern: Field(0), verPattern: Field(0), size: Field(0) });
  }

  isNull(): Bool {
    return this.end.getField().equals(Field(1));
  }

  // Validates that the ship is not out of bounds
  validate() {
    const start = Provable.if(
      this.direction.equals(Field(0)),
      this.end.x.add(Field(10)).sub(this.size.sub(Field(1))),
      this.end.y.add(Field(10)).sub(this.size.sub(Field(1)))
    );
    start.assertGreaterThanOrEqual(Field(10), "ship is out of bounds");
  }

}

// A carrier is a ship of length 5
export class Carrier extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b11111);
    const vp = Field(0b10000000001000000000100000000010000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(5) });
  }
}

// A battleship is a ship of length 4
export class Battleship extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b1111);
    const vp = Field(0b1000000000100000000010000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(4)});
  }
}

// A cruiser is a ship of length 3
export class Cruiser extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b111);
    const vp = Field(0b100000000010000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(3)});
  }
}

//  A submarine is a ship of length 3
export class Submarine extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b111);
    const vp = Field(0b100000000010000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(3)});
  }
}

// A destroyer is a ship of length 2
export class Destroyer extends Ship {
  constructor(value: { end: Position, direction: Field }) {
    const hp = Field(0b11);
    const vp = Field(0b10000000001);
    super({ end: value.end, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(2)});
  }
}
