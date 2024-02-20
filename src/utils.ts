import { Field, Struct, Provable } from 'o1js';

export class Position extends Struct({ x: Field, y: Field }) {
  constructor(value: { x: Field, y: Field }) {
    super(value);
  }

  add(jump: Field, direction: Field): Position {
    return new Position({
      x: Provable.if(
        direction.equals(Field(0)),
        this.x.add(jump).sub(Field(1)),
        this.x
      ),
      y: Provable.if(
        direction.equals(Field(1)),
        this.y.add(jump).sub(Field(1)),
        this.y
      )
    });
  }

  getField(): Field {
    const yMul = Provable.switch([
      this.y.equals(Field(0)),
      this.y.equals(Field(1)),
      this.y.equals(Field(2)),
      this.y.equals(Field(3)),
      this.y.equals(Field(4)),
      this.y.equals(Field(5)),
      this.y.equals(Field(6)),
      this.y.equals(Field(7)),
      this.y.equals(Field(8)),
      this.y.equals(Field(9))
    ],
    Field,
    [
      Field(1237940039285380274899124224), // 1 followed by 90 zeros
      Field(1208925819614629174706176), // 1 followed by 80 zeros
      Field(1180591620717411303424), // 1 followed by 70 zeros
      Field(1152921504606846976), // 1 followed by 60 zeros
      Field(1125899906842624), // 1 followed by 50 zeros
      Field(1099511627776), // 1 followed by 40 zeros
      Field(1073741824), // 1 followed by 30 zeros
      Field(1048576), // 1 followed by 20 zeros
      Field(1024), // 1 followed by 10 zeros
      Field(1)
    ])
    
    const xMul = Provable.switch([
      this.x.equals(Field(0)),
      this.x.equals(Field(1)),
      this.x.equals(Field(2)),
      this.x.equals(Field(3)),
      this.x.equals(Field(4)),
      this.x.equals(Field(5)),
      this.x.equals(Field(6)),
      this.x.equals(Field(7)),
      this.x.equals(Field(8)),
      this.x.equals(Field(9))
    ],
    Field,
    [
      Field(512), // 1 followed by 9 zeros
      Field(256), // 1 followed by 8 zeros
      Field(128), // 1 followed by 7 zeros
      Field(64), // 1 followed by 6 zeros
      Field(32), // 1 followed by 5 zeros
      Field(16), // 1 followed by 4 zeros
      Field(8), // 1 followed by 3 zeros
      Field(4), // 1 followed by 2 zeros
      Field(2), // 1 followed by 1 zero
      Field(1) // 1
    ])
    return xMul.mul(yMul);
  }
}