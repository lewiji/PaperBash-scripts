import { node, property } from "../decorators";

export default class Explosions extends godot.Spatial {
  @node
  public explosionSprite: godot.AnimatedSprite3D;

  @property({ default: "flame1" })
  public defaultAnimation;

  explode(explosion = ""): void {
    this.explosionSprite.show();
    if (explosion === "") {
      this.explosionSprite.play(this.defaultAnimation);
    } else {
      if (explosion === "random") {
        const names = this.explosionSprite.get_sprite_frames().get_animation_names();
        console.log(names);
        this.explosionSprite.play(names.get(godot.randi() % names.size()));
      } else {
        this.explosionSprite.play(explosion);
      }
    }
  }

  _process(): void {
    if (
      this.explosionSprite.playing &&
      this.explosionSprite.get_frame() ===
        this.explosionSprite.get_sprite_frames().get_frame_count(this.explosionSprite.get_animation()) - 1
    ) {
      this.explosionSprite.hide();
    }
  }
}
