import { Field, ZkProgram, verify, Gadgets, Bool, Poseidon, Struct } from 'o1js';
import { Carrier } from './ships.js';
import { Board } from './board.js';
import { Position } from './utils.js';

const toBin = (str: string) => {
  return str.replace(/██/g, '1').replace(/ {2}/g, '0');
}

class TargetAndBoardCommitment extends Struct({ target: Position, boardCommitment: Field}) {
  constructor(value: { target: Position, boardCommitment: Field }) {
    super(value);
  }
}

const HitOrMiss = ZkProgram({
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

const ValidateBoard = ZkProgram({
  name: "validateBoard",
  publicOutput: Field,

  methods: {
    run: {
      privateInputs: [Field], // board

      method(board: Field): Field {
        // Validate that the board is valid
        //...

        // If the board is valid, return a hash of the boardm
        return Poseidon.hash([board]);
      },
    },
  }
});

const { verificationKey } = await HitOrMiss.compile();

const begin = performance.now();
console.log("starting proof generation");

//    _0__1__2__3__4__5__6__7__8__9__
// 0 |                ██ ██ ██ ██   | 0
// 1 |       ██                     | 1
// 2 |       ██                ██   | 2
// 3 |       ██                ██   | 3
// 4 |       ██                ██   | 4
// 5 |       ██                     | 5
// 6 |                              | 6
// 7 |       ██ ██ ██               | 7
// 8 |                      ██      | 8
// 9 |______________________██______| 9
//    _0__1__2__3__4__5__6__7__8__9__


const carrier = new Carrier({ end: new Position({ x: Field(2), y: Field(5) }), direction: Field(1) });


const board = new Board( { carrier: carrier });

const targetStr = ( '                    ' +
                    '                    ' + 
                    '                    ' +
                    '                    ' +
                    '                    ' +
                    '                ██  ' +
                    '                    ' +
                    '                    ' +
                    '                    ' +
                    '                    ' );

const targetBin = BigInt('0b' + toBin(targetStr));
// const targetField = new Position({ x: Field(8), y: Field(5) });
const targetField = new Position({ x: Field(2), y: Field(5) });

const target = new TargetAndBoardCommitment({ target: targetField, boardCommitment: board.getHash() });

const hitOrMiss = await HitOrMiss.run(target, board);
const end = performance.now();
console.log("proof generation took: ", end - begin, " ms");

const ok = await verify(hitOrMiss, verificationKey);

if (hitOrMiss.publicOutput.toBoolean()) {
  console.log("Result: Hit");
} else {
  console.log("Result: Miss");
}
if (ok) {
  console.log("proof is valid");
}
// console.log(hitOrMiss.toJSON());
