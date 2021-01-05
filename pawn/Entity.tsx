import Attack from "../attacks/Attack";
import { Invoker, Receiver } from "../command/index";
import { property } from "../decorators";

export default class Entity extends godot.KinematicBody {
  @property({ default: new godot.Vector3(5, 0, 5) })
  speed: godot.Vector3;

  @property({ default: godot.Vector3.ZERO })
  velocity: godot.Vector3;

  @property({ default: 15 })
  gravity: number;

  @property({ default: 22 })
  jumpStrength: number;

  @property({ default: 3 })
  maxHealth: number;

  @property({
    type: godot.TYPE_OBJECT,
    hint: godot.PROPERTY_HINT_RESOURCE_TYPE,
    hint_string: "PackedScene",
  })
  projectile: godot.PackedScene;

  protected world: godot.StaticBody;
  protected netTimer: number;
  protected net_translation: godot.Vector3;

  public currentHealth: number;
  public movement: godot.Vector3;
  public jumping: boolean;
  public invoker: Invoker;
  public receiver: Receiver;

  private lastTranslation: godot.Vector3;
  private lastRotation: godot.Vector3;

  constructor() {
    super();
    this.jumping = false;
    this.invoker = new Invoker();
    this.receiver = new Receiver();
    this.movement = new godot.Vector3(0, 0, 0);
    this.netTimer = 0;
  }

  _ready(): void {
    if (godot.Engine.editor_hint) {
      return;
    }

    const collider = this.$("CollisionShape") as godot.CollisionShape;
    const collisionShape = collider.shape as godot.CapsuleShape;
    const sprite = this.$("Sprite3D") as godot.Sprite3D;
    this.world = this.$("/root/Spatial/World") as godot.StaticBody;
    const newBounds = new godot.BoxShape();
    this.currentHealth = this.maxHealth;
    newBounds.set_extents(
      new godot.Vector3(
        (sprite.get_texture().get_width() * sprite.pixel_size) / 2,
        (sprite.get_texture().get_height() * sprite.pixel_size) / 2,
        0.048,
      ),
    );

    /*collisionShape.set_radius((sprite.get_texture().get_width() * sprite.pixel_size) / 4);
    collisionShape.set_height((sprite.get_texture().get_height() * sprite.pixel_size) / 3);*/

    this.rpc_config("updatePosRot", godot.MultiplayerAPI.RPC_MODE_REMOTE);
    this.rpc_config("net_attack", godot.MultiplayerAPI.RPC_MODE_REMOTE);
    this.rset_config("currentHealth", godot.MultiplayerAPI.RPC_MODE_REMOTE);
  }

  handleJumps(): number {
    return 0;
  }

  handleMovementInput(): godot.Vector3 {
    console.log("implement me!");
    return new godot.Vector3(0, 0, 0);
  }

  handleAttack(data = {}): void {
    console.log("implement me!");
  }

  rotateAndCalculateMovement(): godot.Vector3 {
    const local_direction = this.movement.rotated(new godot.Vector3(0, 1, 0), this.rotation.y);
    return local_direction;
  }

  takeDamage(fromAttack: Attack, dmg = 1): void {
    this.currentHealth -= dmg;
    console.log(this.currentHealth);
  }

  _process(dt: number): void {
    if (this.net_translation !== undefined && !this.get_translation().is_equal_approx(this.net_translation)) {
      this.set_translation(this.get_translation().linear_interpolate(this.net_translation, 0.3));
    }
  }

  _physics_process(dt: number): void {
    // handle movement input
    this.movement = this.handleMovementInput();

    // move and rotate player
    const local_direction = this.rotateAndCalculateMovement();
    const fallSpeed = godot.lerp(this.velocity.y, -this.gravity, 0.05);
    const jumpStrength = this.handleJumps();
    // @ts-ignore
    this.velocity = (local_direction * this.speed) as godot.Vector3;
    this.velocity.y = fallSpeed + jumpStrength;
    this.move_and_slide(this.velocity, godot.Vector3.UP, false, 4, 1.5);

    // reset jumping flag
    if (!this.is_on_floor()) {
      this.jumping = true;
    } else {
      this.jumping = false;
      this.velocity.y = 0;
    }
    if (this.lastRotation !== this.get_rotation() || this.lastTranslation !== this.get_translation()) {
      this.rpc_unreliable("updatePosRot", this.get_translation(), this.get_rotation(), this.movement);
    }

    this.lastRotation = this.get_rotation();
    this.lastTranslation = this.get_translation();
  }

  /** RPC functions */

  updatePosRot(translation: godot.Vector3, rotation: godot.Vector3, movement: godot.Vector3): void {
    if (this.get_translation().distance_to(translation) > 2) {
      this.set_translation(translation);
    }
    this.net_translation = translation;
    this.set_rotation(rotation);
    this.movement = movement;
  }

  net_attack(): void {
    this.handleAttack();
  }
}
