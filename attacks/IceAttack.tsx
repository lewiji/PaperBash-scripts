import Attack from "./Attack";

export default class IceAttack extends Attack {
  private firstStage = false;
  private secondStage = false;

  _ready(): void {
    super._ready();
    const _capsule = new godot.CapsuleShape();
    _capsule.set_radius(0.27);
    _capsule.set_height(0.49);
    this.collisionShape.set_shape(_capsule);
  }

  _physics_process(dt: number) {
    super._physics_process(dt);

    if (this.sprite.frame === 7 && !this.firstStage) {
      this.speed = 5;
      this.firstStage = true;
    }

    if (this.sprite.frame === 14 && !this.secondStage) {
      this.speed = 0;
      this.secondStage = true;
    }

    if (this.sprite.frame === 18) {
      ((this.collisionShape as godot.CollisionShape).shape as godot.CapsuleShape).set_radius(0.46);
    }

    if (this.sprite.frame === 21) {
      ((this.collisionShape as godot.CollisionShape).shape as godot.CapsuleShape).set_radius(0.55);
    }
  }
}