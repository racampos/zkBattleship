import { Field, ZkProgram, Bool, Struct } from 'o1js';
import { Carrier, Battleship, Cruiser, Submarine, Destroyer } from './ships.js';
import { Board } from './board.js';
import { Position } from './utils.js';

export class TargetAndBoardCommitment extends Struct({ target: Position, boardCommitment: Field}) {
  constructor(value: { target: Position, boardCommitment: Field }) {
    super(value);
  }
}

export const HitOrMiss = ZkProgram({
  name: "hitOrMiss",
  publicInput: TargetAndBoardCommitment, // target and board commitment
  publicOutput: Bool,

  methods: {
    run: {
      privateInputs: [Board],

      method(publicInput: TargetAndBoardCommitment, board: Board): Bool {
        // Validate that the board commitment matches the board
        publicInput.boardCommitment.assertEquals(board.getHash(), "board must match the previously commited board");
        // Validate that target is valid
        publicInput.target.x.assertLessThanOrEqual(Field(9), "target x must be less than or equal to 9");
        publicInput.target.y.assertLessThanOrEqual(Field(9), "target y must be less than or equal to 9");
        // Return true if the target is occupied by a ship, false otherwise
        return board.isOccupied(publicInput.target);
      },
    },
  }
});

export const ValidateBoard = ZkProgram({
  name: "validateBoard",
  publicOutput: Field, // hash of the validated board

  methods: {
    run: {
      privateInputs: [Carrier, Battleship, Cruiser, Submarine, Destroyer],

      method(
        carrier: Carrier,
        battleship: Battleship,
        cruiser: Cruiser,
        submarine: Submarine,
        destroyer: Destroyer
      ): Field {
        const board = new Board();
        board.addCarrier(carrier);
        board.addBattleship(battleship);
        board.addCruiser(cruiser);
        board.addSubmarine(submarine);
        board.addDestroyer(destroyer);
        board.validateNoNullShips();
        // If everything is valid, return the hash of the board
        return board.getHash();
      },
    },
  }
});

