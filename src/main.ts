import { Field, verify } from 'o1js';
import { Carrier, Battleship, Cruiser, Submarine, Destroyer } from './ships.js';
import { Board } from './board.js';
import { Position } from './utils.js';
import { HitOrMiss, PublicInput, ValidateBoard } from './zkprograms.js';

let { verificationKey } = await HitOrMiss.compile();
const hitOrMissVerKey = verificationKey;
({ verificationKey } = await ValidateBoard.compile());
const validateBoardVerKey = verificationKey;

// Sample board with one ship of each type
//
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

// Create a board with ships in it
// This is done by each player in secret
const carrier = new Carrier({ start: new Position({ x: Field(2), y: Field(1) }), direction: Field(1) });
const battleship = new Battleship({ start: new Position({ x: Field(5), y: Field(0) }), direction: Field(0) });
const cruiser = new Cruiser({ start: new Position({ x: Field(2), y: Field(7) }), direction: Field(0) });
const submarine = new Submarine({ start: new Position({ x: Field(8), y: Field(2) }), direction: Field(1) });
const destroyer = new Destroyer({ start: new Position({ x: Field(7), y: Field(8) }), direction: Field(1) });
// Instantiate the board and add the ships
const board = new Board();
board.addCarrier(carrier);
board.addBattleship(battleship);
board.addCruiser(cruiser);
board.addSubmarine(submarine);
board.addDestroyer(destroyer);

// Each player validates its board and generates a commitment to their board
// Then they send the commitment to the other player
console.log("starting proof generation");
let begin = performance.now();
const validBoard = await ValidateBoard.run(carrier, battleship, cruiser, submarine, destroyer);
let end = performance.now();
console.log("proof generation took: ", end - begin, " ms");

// the other player verifies the board proof
let ok = await verify(validBoard, validateBoardVerKey);

// For each turn, one player is the attacker and the other is the defender
// The attacker selects a target and sends it to the defender
const targetPosition = new Position({ x: Field(8), y: Field(4) });

// The defender receives the target from the attacker
// then feeds the target and their own board commitment to the HitOrMiss zkProgram

// The public input is a struct with two fields: the target from the attacker and the defender's boardCommitment
const target = new TargetAndBoardCommitment({ target: targetPosition, boardCommitment: validBoard.publicOutput });

// The defender generates a proof that the target is either a hit or miss
// and sends the proof to the attacker
console.log("starting proof generation");
begin = performance.now();
const hitOrMiss = await HitOrMiss.run(target, board);
end = performance.now();
console.log("proof generation took: ", end - begin, " ms");

// The attacker verifies the proof and learns if the target was a hit or miss
ok = await verify(hitOrMiss, hitOrMissVerKey);

// Output the result
if (hitOrMiss.publicOutput.toBoolean()) {
  console.log("Result: Hit");
} else {
  console.log("Result: Miss");
}
if (ok) {
  console.log("proof is valid");
}
// console.log(hitOrMiss.toJSON());
