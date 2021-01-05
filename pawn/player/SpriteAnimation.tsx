import { property } from "../../decorators";
import Player from "./Player";
import { default as Heads } from "./Head";

export default class SpriteAnimation extends godot.AnimatedSprite3D {
  protected player: Player;
  protected head: godot.AnimatedSprite3D;
  private waddlingRight: boolean;
  private waddleSpeed: number;
  protected waddleAmount: number;

  @property({ default: 0 })
  public headId: number;

  @property({ default: 0 })
  public bodyId: number;

  constructor() {
    super();
    this.waddlingRight = true;
    this.waddleSpeed = 3;
    this.waddleAmount = 0;
  }

  _ready(): void {
    this.player = this.$("../") as Player;
    this.head = this.$("SpriteHead") as godot.AnimatedSprite3D;
    this.head.set_sprite_frames(Heads[this.headId]);
  }

  _process(dt: number): void {
    if (this.player.movement.x || this.player.movement.z) {
      // Moving
      // Add rotation for strafing
      const extraRotation = this.handleMovement();
      this.handleHeadPosition();

      if (this.waddlingRight) {
        this.waddleAmount -= this.waddleSpeed * dt;
      } else {
        this.waddleAmount += this.waddleSpeed * dt;
      }

      this.set_rotation(new godot.Vector3(this.rotation.x, extraRotation + this.waddleAmount, this.rotation.z));

      if (this.waddleAmount < -0.4) {
        this.waddlingRight = false;
      }

      if (this.waddleAmount > 0.4) {
        this.waddlingRight = true;
      }
    } else {
      // Not moving
      this.handleIdleAnimation();
    }
  }

  handleIdleAnimation(): void {
    if (this.get_animation() !== "idle_u") {
      this.play("idle_u");
      this.head.play("u");
      this.head.set_flip_h(false);
      this.handleHeadPosition();
      this.waddleAmount = 0;
      this.set_rotation(new godot.Vector3(this.rotation.x, 0, this.rotation.z));
    }
  }

  handleMovement(): number {
    let extraRotation = 0;
    if (this.player.movement.x > 0) {
      // moving right
      this.handleRightSide();

      extraRotation = -0.5;
    } else if (this.player.movement.x < 0) {
      // moving left
      this.handleLeftSide();

      extraRotation = 0.5;
    } else {
      // moving straight or not moving
      if (this.get_animation() !== "walk_u") {
        this.play("walk_u");
      }
      if (this.head.get_animation() !== "walk_u") {
        this.head.play("u");
      }
      this.head.set_flip_h(false);
      this.set_flip_h(false);
      extraRotation = 0;
    }
    return extraRotation;
  }

  handleHeadPosition(): void {
    if (this.get_animation() === "walk_u" || this.get_animation() === "walk_d") {
      switch (this.get_frame()) {
        case 0:
          this.head.set_translation(new godot.Vector3(0, 0.3, 0));
          break;
        case 1:
          this.head.set_translation(new godot.Vector3(0, 0.32, 0));
          break;
        case 2:
          this.head.set_translation(new godot.Vector3(0, 0.3, 0));
          break;
        case 3:
          this.head.set_translation(new godot.Vector3(0, 0.32, 0));
          break;
      }
    } else if (this.get_animation() === "walk_s") {
      switch (this.get_frame()) {
        case 0:
          this.head.set_translation(new godot.Vector3(0, 0.3, 0));
          break;
        case 1:
          this.head.set_translation(new godot.Vector3(0, 0.28, 0));
          break;
        case 2:
          this.head.set_translation(new godot.Vector3(0, 0.3, 0));
          break;
        case 3:
          this.head.set_translation(new godot.Vector3(0, 0.28, 0));
          break;
      }
    } else {
      this.head.set_translation(new godot.Vector3(0, 0.3, 0));
    }
  }

  handleRightSide(): void {
    this.head.play("s");
    this.head.set_flip_h(false);

    if (this.player.movement.z !== 0) {
      if (this.get_animation() !== "walk_u") {
        this.play("walk_u");
      }
      this.set_flip_h(false);
    } else if (this.player.movement.z === 0) {
      if (this.get_animation() !== "walk_s") {
        this.play("walk_s");
      }
      this.set_flip_h(false);
    }
  }

  handleLeftSide(): void {
    this.head.play("s");
    this.head.set_flip_h(true);

    if (this.player.movement.z !== 0) {
      if (this.get_animation() !== "walk_u") {
        this.play("walk_u");
      }
      this.set_flip_h(false);
    } else if (this.player.movement.z === 0) {
      if (this.get_animation() !== "walk_s") {
        this.play("walk_s");
      }
      this.set_flip_h(true);
    }
  }
}
