import { Field, ZkProgram, verify, Gadgets, Bool, Poseidon, Struct } from 'o1js';

const toBin = (str: string) => {
  return str.replace(/██/g, '1').replace(/ {2}/g, '0');
}

class Board extends Struct({ slots: Field }) {
  constructor(value: { slots: Field }) {
    super(value);
  }

  isOccupied(target: Field): Bool {
    return Gadgets.and(this.slots, target, 254).equals(Field(0)).not()
  }

  getHash(): Field {
    return Poseidon.hash([this.slots]);
  }
}

class TargetAndBoardCommitment extends Struct({ target: Field, boardCommitment: Field}) {
  constructor(value: { target: Field, boardCommitment: Field }) {
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
        publicInput.target.assertNotEquals(Field(0), "target must not be 0");
        // Validate that target contains a single 1
        Gadgets.and(publicInput.target, publicInput.target.sub(1), 254).assertEquals(Field(0), "target must contain a single 1");

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
const boardStr = ( '                    ' +
                   '    ██              ' + 
                   '    ██            ██' +
                   '    ██      ██    ██' +
                   '    ██      ██    ██' +
                   '    ██      ██      ' +
                   '            ██      ' +
                   '      ██            ' +
                   '      ██      ██    ' +
                   '      ██      ██    ' );

const boardBin = BigInt('0b' + toBin(boardStr));
const board = new Board( {slots: Field.from(boardBin) });

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
const targetField = Field.from(targetBin);

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
