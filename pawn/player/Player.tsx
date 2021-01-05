import { property } from "../../decorators";
import Entity from "../Entity";
import { AttackCommand } from "../../command/index";
import Attack from "../../attacks/Attack";
import Joystick from "../../ui/Joystick";
import setTimeout from "../../util/setTimeout";
import Config from "../../Config";

import Bodies from "./Body";
import Heads from "./Head";

export default class Player extends Entity {
  @property({ default: 0.005 })
  mouseSensitivity: number;

  private mouseMovement: godot.Vector2;
  private zoomLevel: number;
  private springArm: godot.SpringArm;

  @property({ default: 7 })
  maxMana: number;
  @property({ default: 0.666 })
  manaRegenSeconds: number;
  private regenCounter: number;
  public currentMana: number;

  get headId(): number {
    return this._headId;
  }
  set headId(id: number) {
    this._headId = id;
    (this.$("SpriteBody/SpriteHead") as godot.AnimatedSprite3D).set_sprite_frames(Heads[this.headId]);
  }
  private _headId = 0;

  get bodyId(): number {
    return this._bodyId;
  }
  set bodyId(id: number) {
    this._bodyId = id;
    (this.$("SpriteBody") as godot.AnimatedSprite3D).set_sprite_frames(Bodies[this.bodyId]);
  }
  private _bodyId = 0;
  public playerName = "";
  public attackType = "air";

  public static _instance: Player;
  public static _joystick: Joystick;

  constructor(netPlayer = false) {
    super();
    if (netPlayer) {
      return;
    }
    if (Player._instance !== undefined) {
      throw new Error("Player already exists");
    }
    Player._instance = this;
    this.mouseMovement = new godot.Vector2(0, 0);
    this.regenCounter = 0;
  }

  // Called when the node enters the scene tree for the first time.
  _ready(): void {
    this.currentHealth = this.maxHealth;
    this.currentMana = this.maxMana;
    this.springArm = this.$("SpringArm") as godot.SpringArm;
    this.zoomLevel = this.springArm.spring_length;
    this.playerName = Config._instance.get("playerName") as string;
    this.attackType = Config._instance.get("attack") as string;

    this.headId = Config._instance.get("headId") as number;
    this.bodyId = Config._instance.get("bodyId") as number;

    this.rpc_config("invokeAttackCommand", godot.MultiplayerAPI.RPC_MODE_REMOTESYNC);
    this.rpc_config("takeDamage", godot.MultiplayerAPI.RPC_MODE_MASTERSYNC);

    this.call_deferred("broadcastPlayerInfo");

    this.get_tree().connect("network_peer_connected", (id: number) => {
      console.log(id + "connected");
    });

    console.log(this.projectile.get_path());
  }

  broadcastPlayerInfo(): void {
    this.rset("headId", this.headId);
    this.rset("bodyId", this.bodyId);
    this.rset("playerName", this.playerName);
  }

  _physics_process(delta: number): void {
    if (godot.Engine.editor_hint) {
      return;
    }
    super._physics_process(delta);

    this.regenCounter += delta;

    if (this.regenCounter >= this.manaRegenSeconds) {
      this.regenCounter = 0;
      this.currentMana += 1;
      if (this.currentMana > this.maxMana) {
        this.currentMana = this.maxMana;
      }
    }

    this.handleSpringArm();

    // reset mouse movement for next frame
    this.mouseMovement.x = 0;
    this.mouseMovement.y = 0;
  }

  _input(e: godot.InputEvent): void {
    if (godot.Engine.editor_hint) {
      return;
    }
    if (
      (e instanceof godot.InputEventMouseMotion && !godot.OS.has_touchscreen_ui_hint()) ||
      e instanceof godot.InputEventScreenDrag
    ) {
      if (e instanceof godot.InputEventMouseMotion) {
        this.mouseMovement.x = -e.relative.x * this.mouseSensitivity;
        this.mouseMovement.y = e.relative.y * (this.mouseSensitivity / 4);
      } else {
        if (Player._joystick && Player._joystick.controlling) {
          if (e.index === 1) {
            this.mouseMovement.x = -e.relative.x * this.mouseSensitivity;
            this.mouseMovement.y = e.relative.y * (this.mouseSensitivity / 4);
          }
        } else {
          this.mouseMovement.x = -e.relative.x * this.mouseSensitivity;
          this.mouseMovement.y = e.relative.y * (this.mouseSensitivity / 4);
        }
      }
    } else if (e instanceof godot.InputEventMouseButton && !godot.OS.has_touchscreen_ui_hint()) {
      if (e.is_pressed()) {
        if (e.button_index == godot.BUTTON_WHEEL_UP) {
          this.zoomLevel -= 0.2;
        }
        if (e.button_index == godot.BUTTON_WHEEL_DOWN) {
          this.zoomLevel += 0.2;
        }
        if (e.button_index == godot.BUTTON_LEFT) {
          if (this.is_network_master()) {
            this.rpc("invokeAttackCommand");
          }
        }
      }
    }
  }

  takeDamage(fromAttack: Attack, dmg = 1): void {
    super.takeDamage(fromAttack, dmg);
    const sprite = this.$("SpriteBody") as godot.AnimatedSprite3D;
    sprite.set_modulate(godot.Color.red);
    setTimeout(
      () => {
        sprite.set_modulate(godot.Color.white);
      },
      this,
      0.15,
    );
  }

  invokeAttackCommand(): void {
    if (this.currentMana <= 0) {
      return;
    }
    this.currentMana -= 1;
    this.invoker.storeAndInvoke(new AttackCommand(this));
  }

  handleAttack(): void {
    const bullet = this.projectile.instance() as Attack;
    const tree = this.get_node("/root/Spatial/Attacks");

    bullet.set_global_transform(this.get_global_transform());
    bullet.attackType = this.attackType;
    tree.add_child(bullet);
  }

  handleMovementInput(): godot.Vector3 {
    if (Player._joystick && Player._joystick.controlling) {
      return Player._joystick.movement;
    }
    let movement = new godot.Vector3(0, 0, 0);
    if (godot.Input.is_action_pressed("move_forward")) {
      movement.z = -1;
    } else if (godot.Input.is_action_pressed("move_backward")) {
      movement.z = 1;
    }
    if (godot.Input.is_action_pressed("move_left")) {
      movement.x = -1;
    } else if (godot.Input.is_action_pressed("move_right")) {
      movement.x = 1;
    }
    if (movement.x !== 0 && movement.z !== 0) {
      movement = new godot.Vector3(movement.x * 0.666, movement.y, movement.z * 0.666);
    }
    return movement;
  }

  rotateAndCalculateMovement(): godot.Vector3 {
    this.rotate_object_local(godot.Vector3.UP, this.mouseMovement.x);
    return super.rotateAndCalculateMovement();
  }

  handleSpringArm(): void {
    // rotate camera arm with mouse y movement
    this.springArm.rotate_object_local(godot.Vector3.LEFT, this.mouseMovement.y);

    // constrain rotation of camera arm
    if (this.springArm.rotation_degrees.x > 12) {
      this.springArm.set_rotation_degrees(new godot.Vector3(12, 0, 0));
    } else if (this.springArm.rotation_degrees.x < -50) {
      this.springArm.set_rotation_degrees(new godot.Vector3(-50, 0, 0));
    }

    // lerp camera zoom
    if (this.zoomLevel !== this.springArm.spring_length) {
      this.springArm.spring_length = godot.lerp(this.springArm.spring_length, this.zoomLevel, 0.05);
    }
  }

  handleJumps(): number {
    let jumpStrength = 0;
    // handle jumps
    if (!this.jumping && godot.Input.is_action_just_pressed("move_jump")) {
      jumpStrength = this.jumpStrength;
      this.jumping = true;
    }

    return jumpStrength;
  }
}
