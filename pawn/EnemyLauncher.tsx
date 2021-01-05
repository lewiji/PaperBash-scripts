import setTimeout from "../util/setTimeout";
// @ts-ignore
import EnemiesScene from "res://scenes/Enemies.tscn";
import NPC from "./NPC";
import { node } from "../decorators";
import { generateUUIDv4 } from "../util/uuid-v4";

export default class EnemyLauncher extends godot.Spatial {
  @node
  private launcherSource: godot.Spatial;
  @node
  private world: godot.StaticBody;

  private enemy: NPC;
  private launchTo: godot.Vector3;
  private enemiesScene: godot.Spatial;

  _ready(): void {
    this.enemiesScene = EnemiesScene.instance() as godot.Spatial;

    const network = this.get_node("/root/Network").connect("startEtVous", () => {
      this.launch(1);
    });

    const initEnemies = [];
    for (let i = 0; i < this.enemiesScene.get_child_count(); i++) {
      const enemy = this.enemiesScene.get_child(i).duplicate() as NPC;
      enemy.set_translation(new godot.Vector3(0, -1, 0));
      this.add_child(enemy);
      initEnemies.push(enemy);
    }

    setTimeout(
      () => {
        initEnemies.forEach((v) => v.queue_free());
      },
      this,
      1,
    );

    this.rpc_config("remote_launch", godot.MultiplayerAPI.RPC_MODE_PUPPET);
  }

  launch(timeout = 4): void {
    if (this.is_network_master()) {
      setTimeout(
        () => {
          const uuid = generateUUIDv4();
          const enemyId = godot.randi() % this.enemiesScene.get_child_count();
          const enemy = this.enemiesScene.get_child(enemyId).duplicate() as NPC;
          enemy.set_name(uuid);
          enemy.connect("ready", () => {
            enemy.set_physics_process(false);
          });
          this.add_child(enemy);
          this.launchTo = enemy.getPoint_Safe();
          this.rpc("remote_launch", enemyId, uuid, this.launchTo);
          enemy.set_translation(
            this.to_local((this.launcherSource.get_node("Earth") as godot.MeshInstance).get_global_transform().origin),
          );

          this.enemy = enemy;
        },
        this,
        timeout,
      );
    }
  }

  remote_launch(enemyId: number, uuid: string, to: godot.Vector3): void {
    const enemy = this.enemiesScene.get_child(enemyId).duplicate() as NPC;
    enemy.connect("ready", () => {
      enemy.set_physics_process(false);
    });
    enemy.set_name(uuid);
    this.launchTo = to;
    this.add_child(enemy);
    enemy.set_translation(
      this.to_local((this.launcherSource.get_node("Earth") as godot.MeshInstance).get_global_transform().origin),
    );
    this.enemy = enemy;
  }

  _physics_process(): void {
    if (this.enemy) {
      this.enemy.set_translation(this.enemy.get_translation().linear_interpolate(this.launchTo, 0.04));

      if (this.enemy.get_global_transform().origin.distance_to(this.launchTo) < 5) {
        this.enemy.set_physics_process(true);
        this.enemy = undefined;
        this.launch();
      }
    }
  }
}
