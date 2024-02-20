import { Field, Bool, Struct, Provable } from 'o1js';
import { Position } from './utils.js';

// A ship is defined by:
// - the starting position of the ship
// - the direction of the ship (0: horizontal, 1: vertical)
// - the pattern of the ship in the horizontal direction
// - the pattern of the ship in the vertical direction
// - the size of the ship
export class Ship extends Struct({ start: Position, direction: Field, horPattern: Field, verPattern: Field, size: Field }) {
  constructor(value: { start: Position, direction: Field, horPattern: Field, verPattern: Field, size: Field }) {
    super(value);
  }

  // Returns a Field representing the occupied slots on the board
  getSlots(): Field {
    const end = this.start.add(this.size, this.direction);
    return Provable.if(
      this.direction.equals(Field(0)),
      this.horPattern.mul(end.getField()),
      this.verPattern.mul(end.getField())
    );
  }

  // Returns a null Ship
  static null(): Ship {
    return new Ship({ start: new Position({ x: Field(9), y: Field(9) }), direction: Field(0), horPattern: Field(0), verPattern: Field(0), size: Field(0) });
  }

  isNull(): Bool {
    return this.start.getField().equals(Field(1));
  }

  // Validates that the ship is not out of bounds
  validate() {
    const end = Provable.if(
      this.direction.equals(Field(0)),
      this.start.x.add(this.size).sub(Field(1)),
      this.start.y.add(this.size).sub(Field(1))
    );
    end.assertLessThanOrEqual(Field(9), "ship is out of bounds");
  }

}

// A carrier is a ship of length 5
export class Carrier extends Ship {
  constructor(value: { start: Position, direction: Field }) {
    const hp = Field(0b11111);
    const vp = Field(0b10000000001000000000100000000010000000001);
    super({ start: value.start, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(5) });
  }
}

// A battleship is a ship of length 4
export class Battleship extends Ship {
  constructor(value: { start: Position, direction: Field }) {
    const hp = Field(0b1111);
    const vp = Field(0b1000000000100000000010000000001);
    super({ start: value.start, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(4)});
  }
}

// A cruiser is a ship of length 3
export class Cruiser extends Ship {
  constructor(value: { start: Position, direction: Field }) {
    const hp = Field(0b111);
    const vp = Field(0b100000000010000000001);
    super({ start: value.start, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(3)});
  }
}

//  A submarine is a ship of length 3
export class Submarine extends Ship {
  constructor(value: { start: Position, direction: Field }) {
    const hp = Field(0b111);
    const vp = Field(0b100000000010000000001);
    super({ start: value.start, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(3)});
  }
}

// A destroyer is a ship of length 2
export class Destroyer extends Ship {
  constructor(value: { start: Position, direction: Field }) {
    const hp = Field(0b11);
    const vp = Field(0b10000000001);
    super({ start: value.start, direction: value.direction, horPattern: hp, verPattern: vp, size: Field(2)});
  }
}
