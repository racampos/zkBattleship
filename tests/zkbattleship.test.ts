import { Field, verify, Proof } from 'o1js';
import { Carrier, Battleship, Cruiser, Submarine, Destroyer } from '../src/ships.js';
import { Board } from '../src/board.js';
import { Position } from '../src/utils.js';
import { HitOrMiss, PublicInput, ValidateBoard } from '../src/zkprograms.js';

describe('Basic Functionality', () => {
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
      carrier = new Carrier({ start: new Position({ x: Field(2), y: Field(1) }), direction: Field(1) });
      battleship = new Battleship({ start: new Position({ x: Field(5), y: Field(0) }), direction: Field(0) });
      cruiser = new Cruiser({ start: new Position({ x: Field(2), y: Field(7) }), direction: Field(0) });
      submarine = new Submarine({ start: new Position({ x: Field(8), y: Field(2) }), direction: Field(1) });
      destroyer = new Destroyer({ start: new Position({ x: Field(7), y: Field(8) }), direction: Field(1) });
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
      const carrier = new Carrier({ start: new Position({ x: Field(2), y: Field(1) }), direction: Field(1) });
      // This battleship spans from (2,1) to (5,1), thus overlapping with the carrier
      const battleship = new Battleship({ start: new Position({ x: Field(2), y: Field(1) }), direction: Field(0) });
      board.addCarrier(carrier);
      expect(() => board.addBattleship(battleship)).toThrowError('battleship is overlapping with another ship');
    });
    it('should not allow adding a ship that already exists on the board', async () => {
      const board = new Board();
      const carrier1 = new Carrier({ start: new Position({ x: Field(2), y: Field(2) }), direction: Field(1) });
      const carrier2 = new Carrier({ start: new Position({ x: Field(3), y: Field(2) }), direction: Field(1) });
      board.addCarrier(carrier1);
      expect(() => board.addCarrier(carrier2)).toThrowError('carrier already added');
    });
    it('should not allow adding a ship with an invalid position', async () => {
      const board = new Board();
      // This carrier spans from (6,1) to (10,1), thus being out of bounds
      const carrier = new Carrier({ start: new Position({ x: Field(6), y: Field(1) }), direction: Field(0) });
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
      const target = new PublicInput({ target: hitTargetPosition, previousHits: Field(0), boardCommitment: board.getHash() });
      const hitOrMissProof = await HitOrMiss.run(target, board);
      expect(hitOrMissProof.publicOutput.toBoolean()).toEqual(true);
      expect(await verify(hitOrMissProof, verificationKey)).toEqual(true);
    });
    it('HitOrMiss.run() should return false for a miss', async () => {
      const { verificationKey } = await HitOrMiss.compile();
      const missTargetPosition = new Position({ x: Field(8), y: Field(5) });
      const target = new PublicInput({ target: missTargetPosition, previousHits: Field(0), boardCommitment: board.getHash() });
      const hitOrMissProof = await HitOrMiss.run(target, board);
      expect(hitOrMissProof.publicOutput.toBoolean()).toEqual(false);
      expect(await verify(hitOrMissProof, verificationKey)).toEqual(true);
    });
    it('HitOrMiss.run() should throw an error if the board commitment does not match the board', async () => {
      await HitOrMiss.compile();
      const invalidBoardCommitment = new PublicInput({ target: new Position({ x: Field(0), y: Field(0) }), previousHits: Field(0), boardCommitment: Field(0) });
      expect(() => HitOrMiss.run(invalidBoardCommitment, board)).rejects.toThrowError('board must match the previously commited board');
    });
    it('HitOrMiss.run() should throw an error if the target x coordinate is invalid', async () => {
      await HitOrMiss.compile();
      const invalidTarget = new PublicInput({ target: new Position({ x: Field(10), y: Field(0) }), previousHits: Field(0), boardCommitment: board.getHash() });
      expect(() => HitOrMiss.run(invalidTarget, board)).rejects.toThrowError('target x must be less than or equal to 9');
    });
    it('HitOrMiss.run() should throw an error if the target y coordinate is invalid', async () => {
      await HitOrMiss.compile();
      const invalidTarget = new PublicInput({ target: new Position({ x: Field(0), y: Field(10) }), previousHits: Field(0), boardCommitment: board.getHash() });
      expect(() => HitOrMiss.run(invalidTarget, board)).rejects.toThrowError('target y must be less than or equal to 9');
    });
    it('HitOrMiss.run() should throw an error if the target matches any previous hits', async () => {
      await HitOrMiss.compile();
      const target = new Position({ x: Field(5), y: Field(5) });
      // Sets previousHits to match the current target
      const invalidTarget = new PublicInput({ target: target, previousHits: target.getField(), boardCommitment: board.getHash() });
      expect(() => HitOrMiss.run(invalidTarget, board)).rejects.toThrowError('target must not match any previous hits');
    });
  });
  describe('Performance', () => {
    it('should generate a proof for a valid board in less than 15 seconds', async () => {
      const { verificationKey } = await ValidateBoard.compile();
      let begin = performance.now();
      const validBoard = await ValidateBoard.run(carrier, battleship, cruiser, submarine, destroyer);
      let end = performance.now();
      expect(end - begin).toBeLessThan(15000);
      expect(await verify(validBoard, verificationKey)).toEqual(true);
    });
    it('should generate a proof for a hit or miss in less than 15 seconds', async () => {
      const { verificationKey } = await HitOrMiss.compile();
      let begin = performance.now();
      const target = new PublicInput({ target: new Position({ x: Field(8), y: Field(4) }), previousHits: Field(0), boardCommitment: board.getHash() });
      const hitOrMissProof = await HitOrMiss.run(target, board);
      let end = performance.now();
      expect(end - begin).toBeLessThan(15000);
      expect(await verify(hitOrMissProof, verificationKey)).toEqual(true);
    });    
  });    

});

describe('Game Play', () => {
  let player1Board: Board;
  let player2Board: Board;
  let validPlayer1BoardProof: Proof<undefined, Field>;
  let validPlayer2BoardProof: Proof<undefined, Field>;
  let player1BoardCommitment: Field;
  let player2BoardCommitment: Field;
  let player1PreviousHits = Field(0);
  let player2PreviousHits = Field(0);


  beforeAll(async () => {
    // Sample player 1 board with one ship of each type
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

    player1Board = new Board();
    const carrier1 = new Carrier({ start: new Position({ x: Field(2), y: Field(1) }), direction: Field(1) });
    const battleship1 = new Battleship({ start: new Position({ x: Field(5), y: Field(0) }), direction: Field(0) });
    const cruiser1 = new Cruiser({ start: new Position({ x: Field(2), y: Field(7) }), direction: Field(0) });
    const submarine1 = new Submarine({ start: new Position({ x: Field(8), y: Field(2) }), direction: Field(1) });
    const destroyer1 = new Destroyer({ start: new Position({ x: Field(7), y: Field(8) }), direction: Field(1) });
    player1Board.addCarrier(carrier1);
    player1Board.addBattleship(battleship1);
    player1Board.addCruiser(cruiser1);
    player1Board.addSubmarine(submarine1);
    player1Board.addDestroyer(destroyer1);

    // Sample player 2 board with one ship of each type
    //
    //    _0__1__2__3__4__5__6__7__8__9__
    // 0 |             ██ ██ ██ ██ ██   | 0
    // 1 |       ██                     | 1
    // 2 |       ██                     | 2
    // 3 |       ██                ██   | 3
    // 4 |             ██ ██       ██   | 4
    // 5 |                         ██   | 5
    // 6 |                              | 6
    // 7 |          ██ ██ ██ ██         | 7
    // 8 |                              | 8
    // 9 |______________________________| 9
    //    _0__1__2__3__4__5__6__7__8__9__

    player2Board = new Board();
    const carrier2 = new Carrier({ start: new Position({ x: Field(4), y: Field(0) }), direction: Field(0) });
    const battleship2 = new Battleship({ start: new Position({ x: Field(3), y: Field(7) }), direction: Field(0) });
    const cruiser2 = new Cruiser({ start: new Position({ x: Field(2), y: Field(1) }), direction: Field(1) });
    const submarine2 = new Submarine({ start: new Position({ x: Field(8), y: Field(3) }), direction: Field(1) });
    const destroyer2 = new Destroyer({ start: new Position({ x: Field(4), y: Field(4) }), direction: Field(0) });
    player2Board.addCarrier(carrier2);
    player2Board.addBattleship(battleship2);
    player2Board.addCruiser(cruiser2);
    player2Board.addSubmarine(submarine2);
    player2Board.addDestroyer(destroyer2);
  });
  describe('Board Initialization', () => {
    it('should allow player 1 to validate their board and generate a commitment', async () => {
      await ValidateBoard.compile();
      validPlayer1BoardProof = await ValidateBoard.run(player1Board.carrier, player1Board.battleship, player1Board.cruiser, player1Board.submarine, player1Board.destroyer);
      player1BoardCommitment = validPlayer1BoardProof.publicOutput;
    });
    it('should allow player 2 to verify player 1\'s board proof of validity', async () => {
      const { verificationKey } = await ValidateBoard.compile();
      expect(await verify(validPlayer1BoardProof, verificationKey)).toEqual(true);
    });
    it('should allow player 2 to validate their board and generate a commitment', async () => {
      await ValidateBoard.compile();
      validPlayer2BoardProof = await ValidateBoard.run(player2Board.carrier, player2Board.battleship, player2Board.cruiser, player2Board.submarine, player2Board.destroyer);
      player2BoardCommitment = validPlayer2BoardProof.publicOutput;
    });
    it('should allow player 1 to verify player 2\'s board proof of validity', async () => {
      const { verificationKey } = await ValidateBoard.compile();
      expect(await verify(validPlayer2BoardProof, verificationKey)).toEqual(true);
    });
  });
  describe('First move for each player', () => {
    it('should allow player 1 to attack a target position on player 2\'s board and let player 2 generate a proof of hit or miss', async () => {
      const { verificationKey } = await HitOrMiss.compile();
      // Player 1 decides on a target position on player 2's board to attack, then sends it to Player 2
      const player1Target = new Position({ x: Field(8), y: Field(4) });
      // Player 2 generates a proof of hit or miss, then sends it to Player 1
      const hitOrMissProof = await HitOrMiss.run(new PublicInput({ target: player1Target, previousHits: player1PreviousHits, boardCommitment: player2BoardCommitment }), player2Board);
      // Player 1 verifies the proof
      expect(await verify(hitOrMissProof, verificationKey)).toEqual(true);
      // Player 1 updates their previous hits
      player1PreviousHits = player1PreviousHits.add(player1Target.getField());
    });
    it('should allow player 2 to attack a target position on player 1\'s board and let player 1 generate a proof of hit or miss', async () => {
      const { verificationKey } = await HitOrMiss.compile();
      // Player 2 decides on a target position on player 1's board to attack, then sends it to Player 1
      const player2Target = new Position({ x: Field(8), y: Field(4) });
      // Player 1 generates a proof of hit or miss, then sends it to Player 2
      const hitOrMissProof = await HitOrMiss.run(new PublicInput({ target: player2Target, previousHits: player2PreviousHits, boardCommitment: player1BoardCommitment }), player1Board);
      // Player 2 verifies the proof
      expect(await verify(hitOrMissProof, verificationKey)).toEqual(true);
      // Player 2 updates their previous hits
      player2PreviousHits = player2PreviousHits.add(player2Target.getField());
    });
  });
});