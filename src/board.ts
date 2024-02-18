import { Field, ZkProgram, verify, Gadgets, Bool, Poseidon, Struct, Provable } from 'o1js';
import { Ship, Carrier, Battleship, Cruiser, Submarine, Destroyer } from './ships.js';
import { Position } from './utils.js';


export class Board extends Struct({ 
  carrier: Carrier,
  battleship: Battleship,
  cruiser: Cruiser,
  submarine: Submarine,
  destroyer: Destroyer
 }) {
  constructor() {
    super({
      carrier: Ship.null(),
      battleship: Ship.null(),
      cruiser: Ship.null(),
      submarine: Ship.null(),
      destroyer: Ship.null()
    });
  }

  addCarrier(carrier: Carrier) {
    // make sure that the carrier is not already added
    this.carrier.isNull().assertTrue("carrier already added");

    // make sure that the carrier is not overlapping with any other ship
    const boardSlots = this.getSlots();
    const carrierSlots = carrier.getSlots();
    Gadgets.and(boardSlots, carrierSlots, 100).assertEquals(Field(0), "carrier is overlapping with another ship");

    // if all checks pass, add the carrier
    this.carrier = carrier;
  }

  addBattleship(battleship: Battleship) {
    // make sure that the battleship is not already added
    this.battleship.isNull().assertTrue("battleship already added");

    // make sure that the battleship is not overlapping with any other ship
    const boardSlots = this.getSlots();
    const battleshipSlots = battleship.getSlots();
    Gadgets.and(boardSlots, battleshipSlots, 100).assertEquals(Field(0), "battleship is overlapping with another ship");

    // if all checks pass, add the battleship
    this.battleship = battleship;
  }

  addCruiser(cruiser: Cruiser) {
    // make sure that the cruiser is not already added
    this.cruiser.isNull().assertTrue("cruiser already added");

    // make sure that the cruiser is not overlapping with any other ship
    const boardSlots = this.getSlots();
    const cruiserSlots = cruiser.getSlots();
    Gadgets.and(boardSlots, cruiserSlots, 100).assertEquals(Field(0), "cruiser is overlapping with another ship");

    // if all checks pass, add the cruiser
    this.cruiser = cruiser;
  }

  addSubmarine(submarine: Submarine) {
    // make sure that the submarine is not already added
    this.submarine.isNull().assertTrue("submarine already added");

    // make sure that the submarine is not overlapping with any other ship
    const boardSlots = this.getSlots();
    const submarineSlots = submarine.getSlots();
    Gadgets.and(boardSlots, submarineSlots, 100).assertEquals(Field(0), "submarine is overlapping with another ship");

    // if all checks pass, add the submarine
    this.submarine = submarine;
  }

  addDestroyer(destroyer: Destroyer) {
    // make sure that the destroyer is not already added
    this.destroyer.isNull().assertTrue("destroyer already added");

    // make sure that the destroyer is not overlapping with any other ship
    const boardSlots = this.getSlots();
    const destroyerSlots = destroyer.getSlots();
    Gadgets.and(boardSlots, destroyerSlots, 100).assertEquals(Field(0), "destroyer is overlapping with another ship");

    // if all checks pass, add the destroyer
    this.destroyer = destroyer;
  }

  getSlots(): Field {
    return this.carrier.getSlots().add(this.battleship.getSlots()).add(this.cruiser.getSlots()).add(this.submarine.getSlots()).add(this.destroyer.getSlots());
  }

  isOccupied(target: Position): Bool {
    return Gadgets.and(this.getSlots(), target.getField(), 254).equals(Field(0)).not()
  }

  getHash(): Field {
    return Poseidon.hash([this.getSlots()]);
  }
}