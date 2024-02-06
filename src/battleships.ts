import { Field, ZkProgram, verify, Gadgets } from 'o1js';

const Battleships = ZkProgram({
  name: "battleships",
  publicInput: Field, // target

  methods: {
    missed: {
      privateInputs: [Field], // board

      method(publicInput: Field, board: Field) {
        const result = Gadgets.and(board, publicInput, 100);
        result.assertEquals(Field(0));
      },
    }
  }
});

const { verificationKey } = await Battleships.compile();

const begin = performance.now();
console.log("starting proof generation");
const boardStr = "0100000000" +
                 "0010000000" + 
                 "0010000001" +
                 "0010001001" +
                 "0010001001" +
                 "0010001000" +
                 "0000001000" +
                 "0010000000" +
                 "0010000100" +
                 "0010000100";
const boardBin = parseInt(boardStr, 2);
const board = Field.from(boardBin);

const targetStr = "0000000000" +
                  "0001000000" + 
                  "0000000000" +
                  "0000000000" +
                  "0000000000" +
                  "0000000000" +
                  "0000000000" +
                  "0000000000" +
                  "0000000000" +
                  "0000000000";
const targetBin = parseInt(targetStr, 2);
const target = Field.from(targetBin);

const missedProof = await Battleships.missed(target, board);
const end = performance.now();
console.log("proof generation took: ", end - begin, " ms");


const ok = await verify(missedProof, verificationKey);

console.log(ok);

missedProof.publicInput.