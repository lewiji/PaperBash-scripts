import SpriteAnimation from "./player/SpriteAnimation";

enum Direction {
  Up = "u",
  Down = "d",
  Left = "l",
  Right = "r",
}

export default class NetworkPlayerAnimation extends SpriteAnimation {
  getDirection(): string {
    const rotation = this.player.get_rotation_degrees().y;
    if (rotation >= -70 && rotation < 20) {
      return Direction.Up;
    } else if (rotation >= 20 && rotation < 110) {
      return Direction.Left;
    } else if (rotation >= 110 && rotation < 200) {
      return Direction.Down;
    } else {
      return Direction.Right;
    }
  }

  handleMovement(): number {
    const direction = this.getDirection();
    let extraRotation = 0;

    if (direction === Direction.Right) {
      // moving right
      this.handleRightSide();

      extraRotation = -0.5;
    } else if (direction === Direction.Left) {
      // moving left
      this.handleLeftSide();

      extraRotation = 0.5;
    } else {
      if (direction === Direction.Down) {
        if (this.get_animation() !== "walk_d") {
          this.play("walk_d");
        }
        if (this.head.get_animation() !== Direction.Down) {
          this.head.play(Direction.Down);
        }
      } else {
        if (this.get_animation() !== "walk_u") {
          this.play("walk_u");
        }
        if (this.head.get_animation() !== Direction.Up) {
          this.head.play(Direction.Up);
        }
      }

      this.head.set_flip_h(false);
      this.set_flip_h(false);
      extraRotation = 0;
    }
    return extraRotation;
  }

  handleRightSide(): void {
    this.head.play("s");
    this.head.set_flip_h(false);
    if (this.get_animation() !== "walk_s") {
      this.play("walk_s");
    }
    this.set_flip_h(false);
  }

  handleLeftSide(): void {
    this.head.play("s");
    this.head.set_flip_h(true);

    if (this.get_animation() !== "walk_s") {
      this.play("walk_s");
    }
    this.set_flip_h(true);
  }

  handleIdleAnimation(): void {
    const direction = this.getDirection();
    if (this.get_animation().substr(0, 4) !== "idle") {
      const dir = this.get_animation().substr(5, 1);
      this.play(`idle_${dir}`);
      this.head.play(dir);
      if (dir === Direction.Up || dir === Direction.Down) {
        this.head.set_flip_h(false);
      }
      this.handleHeadPosition();
      this.waddleAmount = 0;
    } else {
      if (direction === Direction.Up) {
        this.play("idle_u");
        this.head.play(Direction.Up);
        this.head.set_flip_h(false);
        this.set_flip_h(false);
      } else if (direction === Direction.Left) {
        this.play("idle_s");
        this.head.play("s");
        this.set_flip_h(true);
        this.head.set_flip_h(true);
      } else if (direction === Direction.Down) {
        this.play("idle_d");
        this.head.play(Direction.Down);
        this.head.set_flip_h(false);
        this.set_flip_h(false);
      } else {
        this.play("idle_s");
        this.head.play("s");
        this.set_flip_h(false);
        this.head.set_flip_h(false);
      }
    }
  }
}
