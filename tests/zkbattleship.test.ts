import { Field, verify, Proof } from 'o1js';
import { Carrier, Battleship, Cruiser, Submarine, Destroyer } from '../src/ships.js';
import { Board } from '../src/board.js';
import { Position } from '../src/utils.js';
import { HitOrMiss, TargetAndBoardCommitment, ValidateBoard } from '../src/zkprograms.js';

describe('HitOrMiss', () => {
  let carrier: Carrier;
  let battleship: Battleship;
  let cruiser: Cruiser;
  let submarine: Submarine;
  let destroyer: Destroyer;
  let board: Board;
  let validBoardProof: Proof<undefined, Field>;

  beforeAll(async () => {
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
      carrier = new Carrier({ end: new Position({ x: Field(2), y: Field(5) }), direction: Field(1) });
      battleship = new Battleship({ end: new Position({ x: Field(8), y: Field(0) }), direction: Field(0) });
      cruiser = new Cruiser({ end: new Position({ x: Field(4), y: Field(7) }), direction: Field(0) });
      submarine = new Submarine({ end: new Position({ x: Field(8), y: Field(4) }), direction: Field(1) });
      destroyer = new Destroyer({ end: new Position({ x: Field(7), y: Field(9) }), direction: Field(1) });
      // Instantiate the board and add the ships
      board = new Board();
      board.addCarrier(carrier);
      board.addBattleship(battleship);
      board.addCruiser(cruiser);
      board.addSubmarine(submarine);
      board.addDestroyer(destroyer);
  });

  describe('Board Validation', () => {
    it('should not allow adding a ship that overlaps with an existing one', async () => {
      const board = new Board();
      // This carrier spans from (2,1) to (2,5)
      const carrier = new Carrier({ end: new Position({ x: Field(2), y: Field(5) }), direction: Field(1) });
      // This battleship spans from (2,1) to (5,1), thus overlapping with the carrier
      const battleship = new Battleship({ end: new Position({ x: Field(5), y: Field(1) }), direction: Field(0) });
      board.addCarrier(carrier);
      expect(() => board.addBattleship(battleship)).toThrowError('battleship is overlapping with another ship');
    });
    it('should not allow adding a ship that already exists on the board', async () => {
      const board = new Board();
      const carrier1 = new Carrier({ end: new Position({ x: Field(2), y: Field(5) }), direction: Field(1) });
      const carrier2 = new Carrier({ end: new Position({ x: Field(3), y: Field(5) }), direction: Field(1) });
      board.addCarrier(carrier1);
      expect(() => board.addCarrier(carrier2)).toThrowError('carrier already added');
    });
    it('should not allow adding a ship with an invalid position', async () => {
      const board = new Board();
      // This carrier spans from (-3,1) to (1,1), thus being out of bounds
      const carrier = new Carrier({ end: new Position({ x: Field(1), y: Field(1) }), direction: Field(0) });
      expect(() => board.addCarrier(carrier)).toThrowError('ship is out of bounds');
    });
    it('should not validate a board with at least one null ship', async () => {
      const board = new Board();
      expect(() => board.validateNoNullShips()).toThrowError('at least one ship is null');
    });
    it('should validate a valid board', async () => {
      const { verificationKey } = await ValidateBoard.compile();
      validBoardProof = await ValidateBoard.run(carrier, battleship, cruiser, submarine, destroyer);
      expect(await verify(validBoardProof, verificationKey)).toEqual(true);
    });
    it('the hash from the proof should match the hash of the board', async () => {
      expect(validBoardProof.publicOutput).toEqual(board.getHash());
    });
  });
  describe('Move Validation', () => {
    it('HitOrMiss.run() should return true for a hit', async () => {
      const { verificationKey } = await HitOrMiss.compile();
      const hitTargetPosition = new Position({ x: Field(8), y: Field(4) });
      const target = new TargetAndBoardCommitment({ target: hitTargetPosition, boardCommitment: board.getHash() });
      const hitOrMissProof = await HitOrMiss.run(target, board);
      expect(hitOrMissProof.publicOutput.toBoolean()).toEqual(true);
      expect(await verify(hitOrMissProof, verificationKey)).toEqual(true);
    });
    it('HitOrMiss.run() should return false for a miss', async () => {
      const { verificationKey } = await HitOrMiss.compile();
      const missTargetPosition = new Position({ x: Field(8), y: Field(5) });
      const target = new TargetAndBoardCommitment({ target: missTargetPosition, boardCommitment: board.getHash() });
      const hitOrMissProof = await HitOrMiss.run(target, board);
      expect(hitOrMissProof.publicOutput.toBoolean()).toEqual(false);
      expect(await verify(hitOrMissProof, verificationKey)).toEqual(true);
    });
    it('HitOrMiss.run() should throw an error if the board commitment does not match the board', async () => {
      await HitOrMiss.compile();
      const invalidBoardCommitment = new TargetAndBoardCommitment({ target: new Position({ x: Field(0), y: Field(0) }), boardCommitment: Field(0) });
      expect(() => HitOrMiss.run(invalidBoardCommitment, board)).rejects.toThrowError('board must match the previously commited board');
    });
    it('HitOrMiss.run() should throw an error if the target x coordinate is invalid', async () => {
      await HitOrMiss.compile();
      const invalidTarget = new TargetAndBoardCommitment({ target: new Position({ x: Field(10), y: Field(0) }), boardCommitment: board.getHash() });
      expect(() => HitOrMiss.run(invalidTarget, board)).rejects.toThrowError('target x must be less than or equal to 9');
    });
    it('HitOrMiss.run() should throw an error if the target y coordinate is invalid', async () => {
      await HitOrMiss.compile();
      const invalidTarget = new TargetAndBoardCommitment({ target: new Position({ x: Field(0), y: Field(10) }), boardCommitment: board.getHash() });
      expect(() => HitOrMiss.run(invalidTarget, board)).rejects.toThrowError('target y must be less than or equal to 9');
    });
  });
});