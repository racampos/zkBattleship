import { Field, ZkProgram, verify, Gadgets, Bool, Poseidon, Struct } from 'o1js';
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
        // Validate that target is not 0
        publicInput.target.getField().assertNotEquals(Field(0), "target must not be 0");
        // Validate that target contains a single 1
        Gadgets.and(publicInput.target.getField(), publicInput.target.getField().sub(1), 254).assertEquals(Field(0), "target must contain a single 1");

        // Determine if the target is a hit or miss
        // const result = Gadgets.and(board, publicInput.target, 254);
        // return result.equals(Field(0)).not();
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
        // If the board is valid, return a hash of the board
        return board.getHash();
      },
    },
  }
});

