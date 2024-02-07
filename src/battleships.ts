import { Field, ZkProgram, verify, Gadgets, Bool } from 'o1js';

const toBin = (str: string) => {
  return str.replace(/██/g, '1').replace(/ {2}/g, '0');
}

const Battleships = ZkProgram({
  name: "battleships",
  publicInput: Field, // target
  publicOutput: Bool,

  methods: {
    hitOrMiss: {
      privateInputs: [Field], // board

      method(publicInput: Field, board: Field): Bool {
        // Validate that target is not 0
        publicInput.assertNotEquals(Field(0), "target must not be 0");
        // Validate that target contains a single 1
        Gadgets.and(publicInput, publicInput.sub(1), 254).assertEquals(Field(0), "target must contain a single 1");
        // Determine if the target is a hit or miss
        const result = Gadgets.and(board, publicInput, 254);
        return result.equals(Field(0)).not();
      },
    }
  }
});

const { verificationKey } = await Battleships.compile();

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
const board = Field.from(boardBin);

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
const target = Field.from(targetBin);

const hitOrMiss = await Battleships.hitOrMiss(target, board);
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
