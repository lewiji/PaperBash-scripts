import NPC from "./NPC";

export default class NPCAnimation extends godot.Sprite3D {
  private npc: NPC;
  private waddlingRight: boolean;
  private waddleSpeed: number;
  private waddleAmount: number;

  constructor() {
    super();
    this.waddlingRight = true;
    this.waddleSpeed = 1;
    this.waddleAmount = 0;
  }

  _ready(): void {
    this.npc = this.$("../") as NPC;
    this.waddleSpeed = this.npc.speed.z / 2;
  }

  _process(dt): void {
    if (this.npc.currentPoint !== undefined) {
      if (this.npc.takingDamage || this.npc.currentHealth <= 0 || this.npc.attacking) {
        return;
      }
      // Moving
      // Add rotation for strafing
      const extraRotation = this.handleMovement();

      if (this.waddlingRight) {
        this.waddleAmount -= this.waddleSpeed * dt;
      } else {
        this.waddleAmount += this.waddleSpeed * dt;
      }

      this.set_rotation(new godot.Vector3(this.rotation.x, extraRotation + this.waddleAmount, this.rotation.z));

      if (this.waddleAmount < -0.3) {
        this.waddlingRight = false;
      }

      if (this.waddleAmount > 0.3) {
        this.waddlingRight = true;
      }
    } else {
      // Not moving
      this.waddleAmount = 0;
      this.set_rotation(new godot.Vector3(this.rotation.x, 0, this.rotation.z));
    }
  }

  handleMovement(): number {
    let extraRotation = 0;
    if (this.npc.velocity.x > 0) {
      // moving right
      extraRotation = -0.5;
      this.set_flip_h(false);
    } else if (this.npc.velocity.x < 0) {
      // moving left
      extraRotation = 0.5;
      this.set_flip_h(true);
    } else {
      this.set_flip_h(false);
      extraRotation = 0;
    }
    return extraRotation;
  }
}
