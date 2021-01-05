import { node } from "../decorators";
import Player from "../pawn/player/Player";

export default class Joystick extends godot.Container {
  @node
  private stick: godot.Node2D;

  public controlling: boolean;
  public movement: godot.Vector3;

  constructor() {
    super();
    this.movement = godot.Vector3.ZERO;
  }

  _ready(): void {
    this.stick.connect("controlling", (e) => {
      this.controlling = true;
      this.movement.z = e.y;
      this.movement.x = e.x;
    });

    this.stick.connect("released", () => {
      this.controlling = false;
      this.movement = godot.Vector3.ZERO;
    });

    Player._joystick = this;
  }
}
