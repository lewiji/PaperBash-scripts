import { AttackCommand } from "../command";
import DamageCommand from "../command/DamageCommand";
import { enumeration, node, property } from "../decorators";
import Entity from "../pawn/Entity";
import AttackGroup from "./AttackGroup";

export default class Attack extends godot.KinematicBody {
  @property({ default: 20 })
  speed: number;
  @property({ default: godot.Vector3.FORWARD })
  direction: godot.Vector3;
  @property({ default: false })
  expiresOnAnimationEnd: boolean;
  @property({ default: 2 })
  expiryTime: number;
  @node
  collisionShape: godot.CollisionShape;
  @enumeration(["air", "fire", "ice", "mana", "sparks", "water"], "air")
  attackType: string;

  protected sprite: godot.AnimatedSprite3D;
  protected hasHit: boolean;
  protected flightTime: number;

  constructor() {
    super();
    this.hasHit = false;
    this.flightTime = 0;
  }

  _ready(): void {
    this.sprite = this.$(godot.AnimatedSprite3D);
    this.sprite.play(this.attackType);
  }

  _physics_process(dt: number): void {
    this.flightTime += dt;
    if (!this.hasHit) {
      const local_direction = new godot.Vector3(0, 0, 1).rotated(new godot.Vector3(0, 1, 0), this.rotation.y);
      //@ts-ignore
      const collisions = this.move_and_collide(local_direction * (this.speed * dt) * -1);

      if (collisions) {
        this.hitDetected(collisions);
      }
    } else {
      //this.set_scale(this.get_scale().linear_interpolate(godot.Vector3.ZERO, 0.05));
      const currentColor = this.sprite.get_modulate();
      const newColor = new godot.Color(currentColor.r, currentColor.g, currentColor.b, 0);
      this.sprite.set_modulate(currentColor.linear_interpolate(newColor, 0.5));
      if (this.sprite.get_modulate().a < 0.1) {
        this.queue_free();
      }
    }

    if (
      this.expiresOnAnimationEnd &&
      this.sprite.frame === this.sprite.frames.get_frame_count(this.sprite.get_animation()) - 1
    ) {
      this.queue_free();
    } else if (this.flightTime > this.expiryTime) {
      this.queue_free();
    }
  }

  hitDetected(collisions: godot.KinematicCollision): void {
    this.hasHit = true;
    const collider = collisions.get_collider();
    console.log((collider as godot.Node).get_name());
    if (collider instanceof Entity) {
      const entity = collisions.get_collider() as Entity;
      const dmg = new DamageCommand(entity, this);
      entity.invoker.storeAndInvoke(dmg);
      this.collisionShape.set_disabled(true);
    } else if ((collider as Attack).attackType === "air") {
      this.queue_free();
      (collider as godot.Node).queue_free();
      (this.get_node("/root/Spatial/Attacks") as AttackGroup).invoker.storeAndInvoke(
        new AttackCommand(this.get_node("/root/Spatial/Attacks"), {
          type: "Lightning",
          pos: (collider as godot.Spatial).get_global_transform().origin,
        }),
      );
    }
  }
}
