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

const proof = await SimpleProgram.run(Field(0));

// proof.verify();

const ok = await verify(proof, verificationKey);

console.log(ok);