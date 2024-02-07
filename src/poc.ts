import { Field, ZkProgram, verify } from 'o1js';

const SimpleProgram = ZkProgram({
  name: "simple-program-example",
  publicInput: Field,

  methods: {
    run: {
      privateInputs: [],

      method(publicInput: Field) {
        publicInput.assertEquals(Field(0));
      },
    }
  }
});

const { verificationKey } = await SimpleProgram.compile();

const begin = performance.now();
console.log("starting proof generation");
const proof = await SimpleProgram.run(Field(0));
const end = performance.now();
console.log("proof generation took: ", end - begin, " ms");

// proof.verify();

const ok = await verify(proof, verificationKey);

console.log(ok);