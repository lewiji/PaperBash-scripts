import { property } from "../decorators";
import Entity from "./Entity";
import { AttackCommand } from "../command/index";
import setTimeout from "../util/setTimeout";
import Attack from "../attacks/Attack";
import Player from "./player/Player";
import get3DCollisionLayers from "../util/CollisionLayers";
import Explosions from "./Explosions";

export default class NPC extends Entity {
  @property({
    type: godot.TYPE_OBJECT,
    hint: godot.PROPERTY_HINT_RESOURCE_TYPE,
    hint_string: "Texture",
  })
  spriteTexture: godot.Texture;

  @property({ default: 3.5 })
  attackFrequency: number;

  public currentPoint: godot.Vector3;
  public takingDamage: boolean;
  public attacking: boolean;

  private sprite: godot.Sprite3D;
  private path: godot.PoolVector3Array;
  private fallSpeed: number;
  private launchSpeed: number;
  private launchAngle: godot.Vector3;
  private attackTimer: number;
  private explosion: Explosions;

  constructor() {
    super();
    this.path = new godot.PoolVector3Array();
    this.fallSpeed = 0;
    this.takingDamage = false;
    this.launchSpeed = 0;
    this.launchAngle = godot.Vector3.ZERO;
    this.attacking = false;
    this.attackTimer = 0;
  }

  _ready(): void {
    this.sprite = this.$("Sprite3D") as godot.Sprite3D;
    this.sprite.set_texture(this.spriteTexture);

    this.explosion = this.get_node("Explosions") as Explosions;

    this.rset_config("path", godot.MultiplayerAPI.RPC_MODE_PUPPET);
    this.rset_config("currentPoint", godot.MultiplayerAPI.RPC_MODE_PUPPET);
    this.rpc_config("animateDamage", godot.MultiplayerAPI.RPC_MODE_REMOTESYNC);
    this.rpc_config("dealWithDeath", godot.MultiplayerAPI.RPC_MODE_REMOTESYNC);
    this.rpc_config("takeDamage", godot.MultiplayerAPI.RPC_MODE_REMOTESYNC);

    super._ready();
  }

  _physics_process(dt: number): void {
    if (!this.is_network_master()) {
      //return;
    }

    if (this.is_on_floor()) {
      this.fallSpeed = 0;
    }

    if (this.currentHealth <= 0) {
      return;
    }

    if (this.attacking) {
      if (this.takingDamage) {
        this.attackTimer = 0;
        this.attacking = false;
      } else {
        return;
      }
    }

    this.attackTimer += dt;

    if (this.takingDamage) {
      this.currentPoint = undefined;
      this.path = new godot.PoolVector3Array();
      this.handleDamageRecoil();
    } else if (this.currentPoint !== undefined) {
      this.handlePathFinding();
    } else {
      if (this.is_network_master()) {
        console.log("no points, picking new");
        this.pickNewPosition();
      }
    }

    //this.rpc_unreliable("updatePosRot", this.translation, this.rotation);
  }

  handleDamageRecoil(): void {
    // @ts-ignore
    const direction: godot.Vector3 = -this.launchAngle * 4;
    if (this.launchSpeed > 0) {
      this.fallSpeed = this.launchSpeed;
      this.launchSpeed = 0;
    }
    this.fallSpeed = godot.lerp(this.fallSpeed, -this.gravity, 0.05);
    direction.y = this.fallSpeed;
    if (this.currentHealth <= 0) {
      direction.x = 0;
      direction.z = 0;
    }
    this.move_and_slide(direction, godot.Vector3.UP, false, 10, 2);

    if (this.is_on_floor()) {
      if (this.currentHealth > 0) {
        this.takingDamage = false;
        this.resumeNavigation();
      }
    }
  }

  handlePathFinding(): void {
    const distanceToPoint = this.get_translation().distance_to(
      new godot.Vector3(this.currentPoint.x, this.get_translation().y, this.currentPoint.z),
    );
    if (!this.path.empty() && distanceToPoint < 2) {
      // path is still going
      if (this.attackTimer > this.attackFrequency) {
        if (this.is_network_master()) {
          const players = this.$("/root/Spatial/Players") as godot.Node;
          const player = players.get_child(godot.randi() % players.get_child_count()) as Entity;
          const playerOrigin = player.get_global_transform().origin;
          this.look_at(new godot.Vector3(playerOrigin.x, this.translation.y, playerOrigin.z), godot.Vector3.UP);
          this.invoker.storeAndInvoke(new AttackCommand(this));
        }
      } else {
        this.navigateToNextPoint();
      }
    } else if (this.path.empty() && distanceToPoint < 2) {
      // end of path reached
      this.pickNewPosition();
    } else {
      // Move towards current point
      this.look_at(
        new godot.Vector3(this.currentPoint.x, this.get_translation().y, this.currentPoint.z),
        godot.Vector3.UP,
      );
      // @ts-ignore
      const direction: godot.Vector3 = this.get_global_transform().basis.xform(godot.Vector3.FORWARD) * this.speed;
      this.fallSpeed = godot.lerp(this.fallSpeed, -this.gravity, 0.05);
      direction.y = this.fallSpeed;
      //@ts-ignore
      this.move_and_slide(direction, godot.Vector3.UP, false, 10, 2);
    }
  }

  handleAttack(): void {
    this.attacking = true;
    this.attackTimer = 0;

    const bullet = this.projectile.instance() as Attack;
    const layers = get3DCollisionLayers();
    bullet.set_collision_mask_bit(layers["player"], true);
    bullet.set_collision_mask_bit(layers["enemy"], false);
    bullet.set_collision_layer_bit(layers["player"], false);
    bullet.set_collision_layer_bit(layers["bullet_enemy"], true);
    const tree = this.get_node("/root/Spatial/Attacks");

    //@ts-ignore
    bullet.set_global_transform(this.get_global_transform());
    tree.add_child(bullet);

    setTimeout(
      () => {
        this.attacking = false;
        this.attackTimer = 0;
      },
      this,
      1,
    );
  }

  pickNewPosition(): void {
    if (this.path.empty() && this.is_network_master()) {
      this.getPointFromNavigation();
      this.navigateToNextPoint();
    }
  }

  getPoint_Safe(): godot.Vector3 {
    const navigation = this.world.get_node(godot.Navigation);
    const randPoint = new godot.Vector3(godot.rand_range(-15, 15), 0, godot.rand_range(-15, 15));
    const point = navigation.get_closest_point(randPoint);
    return point;
  }

  getPointFromNavigation(): godot.Vector3 {
    if (this.is_network_master()) {
      const navigation = this.world.get_node(godot.Navigation);
      const point = this.getPoint_Safe();

      this.path = navigation.get_simple_path(navigation.to_local(this.get_global_transform().origin), point);
      this.rset("path", this.path);

      return point;
    }
  }

  navigateToNextPoint(): void {
    if (!this.path.empty()) {
      if (this.is_network_master()) {
        const nextPoint = this.path.get(0);
        this.currentPoint = new godot.Vector3(nextPoint.x, nextPoint.y, nextPoint.z);
        this.rset("currentPoint", this.currentPoint);
        this.path.remove(0);
        this.rset("path", this.path);
      }
    }
  }

  resumeNavigation(): void {
    if (!this.path.empty()) {
      this.look_at(
        new godot.Vector3(this.currentPoint.x, this.get_translation().y, this.currentPoint.z),
        godot.Vector3.UP,
      );
    }
  }

  handleMovementInput(): godot.Vector3 {
    return this.movement;
  }

  takeDamage(fromAttack: Attack, dmg = 1): void {
    if (this.currentHealth <= 0) {
      return;
    }
    super.takeDamage(fromAttack, dmg);

    const sprite = this.$("Sprite3D") as godot.Sprite3D;
    sprite.set_modulate(godot.Color.red);

    if (this.currentHealth <= 0) {
      if (this.is_network_master()) {
        this.rpc("dealWithDeath");
      }
    } else {
      if (this.is_network_master()) {
        console.log("wah");
        this.rpc("animateDamage", fromAttack);
        console.log("wah");
      }
    }
  }

  animateDamage(fromAttack: godot.Vector3): void {
    const sprite = this.$("Sprite3D") as godot.Sprite3D;
    this.takingDamage = true;
    this.launchSpeed = 25;
    this.launchAngle = this.get_global_transform().origin.direction_to(fromAttack);
    setTimeout(
      () => {
        sprite.set_modulate(godot.Color.white);
      },
      this,
      0.15,
    );
  }

  dealWithDeath(): void {
    const sprite = this.$("Sprite3D") as godot.Sprite3D;
    const animationPlayer = sprite.$(godot.AnimationPlayer);
    this.add_collision_exception_with(Player._instance);
    this.explosion.explode("random");
    //this.set_collision_layer_bit(5, true);
    animationPlayer.play("death");
    animationPlayer.connect(godot.AnimationPlayer.animation_finished, this, () => {
      this.queue_free();
    });
  }
}
