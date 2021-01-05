import Config from "../Config";
import { node } from "../decorators";
import Bodies from "../pawn/player/Body";
import Heads from "../pawn/player/Head";

//@ts-ignore
import GameScene from "res://Main.tscn";
//@ts-ignore
import UIScene from "res://scenes/UI.tscn";
import Server from "../multiplayer/Server";
import LoadingScreen from "./Loading";
import MaterialsCache from "../util/MaterialCache";
import setTimeout from "../util/setTimeout";

const attackAvatar = [
  "res://gfx/sprites/spells/Magic Pack  files/air/full/air8.png",
  "res://gfx/sprites/spells/Magic Pack Fire files/sprites/fire/fire7.png",
  "res://gfx/sprites/spells/Magic Pack  files/ice/ice8.png",
  "res://gfx/sprites/spells/Magic Pack 4 files/sprites/wisp/sprites/wisp7.png",
  "res://gfx/sprites/spells/Magic Pack 4 files/sprites/Sparks/Sprites/sparks9.png",
  "res://gfx/sprites/spells/Magic Pack 4 files/sprites/Water/sprites/water19.png",
];

export default class CharacterSelector extends godot.Control {
  @node
  private btnHeadPrev: godot.Button;
  @node
  private btnBodyPrev: godot.Button;
  @node
  private btnHeadNext: godot.Button;
  @node
  private btnBodyNext: godot.Button;
  @node
  private head: godot.AnimatedSprite;
  @node
  private body: godot.AnimatedSprite;
  @node
  private chatBox: godot.RichTextLabel;
  @node
  private inputBox: godot.LineEdit;
  @node
  private sendButton: godot.Button;
  @node
  private playerName: godot.LineEdit;
  @node
  private btnStart: godot.Button;
  @node
  private joinCode: godot.Label;
  @node
  private joinCodeLabel: godot.Label;
  @node
  private attackPrev: godot.Button;
  @node
  private attackNext: godot.Button;
  @node
  private attackSprite: godot.AnimatedSprite;

  private headId = 0;
  private bodyId = 0;
  private attackId = 0;
  private gameScene: godot.Spatial;
  private network: godot.Node;

  initNetwork(network: godot.Node): void {
    this.network = network;

    if ((this.network as Server).joinCode) {
      if ((this.network as Server).joinCode !== "freeplay_mode") {
        this.joinCode.set_text((this.network as Server).joinCode);
        this.joinCode.set_percent_visible(1);
        this.joinCodeLabel.set_percent_visible(1);
      } else {
        this.inputBox.set_editable(false);
        this.sendButton.set_disabled(true);
        this.addChatMessage("PaperBash", "Welcome to freeplay - hone your skills by playing alone.");
      }
      this.btnStart.set_text("START GAME");
    }
  }

  _ready(): void {
    this.rpc_config("createGameScene", godot.MultiplayerAPI.RPC_MODE_PUPPETSYNC);
    this.rpc_config("addChatMessage", godot.MultiplayerAPI.RPC_MODE_REMOTESYNC);

    this.chatBox.append_bbcode("[center][wave amp=50 freq=2][color=purple]Welcome[/color][/wave][/center]");
    this.chatBox.append_bbcode("[wave]\n[/wave]");

    this.bodyId = Config._instance.get("bodyId") as number;
    this.headId = Config._instance.get("headId") as number;
    this.head.set_sprite_frames(Heads[this.headId]);
    this.body.set_sprite_frames(Bodies[this.bodyId]);
    this.playerName.set_text(Config._instance.get("playerName") as string);

    LoadingScreen._instance.hide();

    this.btnHeadNext.connect("pressed", () => {
      this.headId = (this.headId + 1) % (Heads.length - 1);
      this.head.set_sprite_frames(Heads[this.headId]);
    });

    this.btnHeadPrev.connect("pressed", () => {
      this.headId = this.headId - 1;
      if (this.headId < 0) {
        this.headId = Heads.length - 1;
      }
      this.head.set_sprite_frames(Heads[this.headId]);
    });

    this.btnBodyNext.connect("pressed", () => {
      this.bodyId = (this.bodyId + 1) % (Bodies.length - 1);
      this.body.set_sprite_frames(Bodies[this.bodyId]);
    });

    this.btnBodyPrev.connect("pressed", () => {
      this.bodyId = this.bodyId - 1;
      if (this.bodyId < 0) {
        this.bodyId = Bodies.length - 1;
      }
      this.body.set_sprite_frames(Bodies[this.bodyId]);
    });

    this.attackPrev.connect("pressed", () => {
      const attacks = this.attackSprite.get_sprite_frames().get_animation_names();
      this.attackId -= 1;
      if (this.attackId < 0) {
        this.attackId = attacks.size() - 1;
      }
      this.attackSprite.play(attacks.get(this.attackId));
    });

    this.attackNext.connect("pressed", () => {
      const attacks = this.attackSprite.get_sprite_frames().get_animation_names();
      this.attackId = (this.attackId + 1) % attacks.size();
      this.attackSprite.play(attacks.get(this.attackId));
    });

    this.btnStart.connect("pressed", () => {
      Config._instance.set("bodyId", this.bodyId);
      Config._instance.set("headId", this.headId);
      Config._instance.set("playerName", this.playerName.get_text());
      Config._instance.set("attack", this.attackSprite.get_animation());

      if (this.is_network_master()) {
        this.btnStart.set_disabled(true);
        this.rpc("createGameScene");
      } else {
        this.btnStart.set_disabled(true);
        this.btnBodyNext.set_disabled(true);
        this.btnBodyPrev.set_disabled(true);
        this.btnHeadNext.set_disabled(true);
        this.btnHeadPrev.set_disabled(true);
        this.attackNext.set_disabled(true);
        this.attackPrev.set_disabled(true);
        this.playerName.set_editable(false);
        this.btnStart.set_text("Ready...");
        this.sendChatMessage("I'm ready!");
      }
    });

    this.inputBox.connect("text_entered", () => {
      this.sendChatMessage();
    });

    this.sendButton.connect("pressed", () => {
      this.sendChatMessage();
    });

    this.get_tree().connect("network_peer_connected", (id) => {
      this.playerName.set_placeholder(`Player${this.get_tree().get_network_unique_id().toString()}`);
      this.chatBox.append_bbcode(`[rainbow freq=0.2 sat=10 val=20]Player ${id} is here![/rainbow]`);
      this.chatBox.append_bbcode(`\n`);
    });
  }

  sendChatMessage(msg = ""): void {
    if (msg === "") {
      msg = this.inputBox.get_text();
    }
    if (msg === "") {
      return;
    }
    const playerName = this.playerName.get_text() || `Player${this.get_tree().get_network_unique_id()}`;
    this.inputBox.set_text("");
    this.rpc("addChatMessage", playerName, msg);
  }

  addChatMessage(playerName: string, msg: string): void {
    this.chatBox.append_bbcode(`[color=blue]${playerName}:[/color][img=32]${attackAvatar[this.attackId]}[/img] ${msg}`);
    this.chatBox.append_bbcode(`\n`);
  }

  createGameScene(): void {
    if (this.gameScene !== undefined) {
      return;
    }
    LoadingScreen._instance.show("Loading...");
    setTimeout(
      () => {
        const root = this.get_tree().get_root();
        const gameScene = GameScene as godot.PackedScene;
        const instance = gameScene.instance() as godot.Spatial;
        this.gameScene = instance;

        this.gameScene.connect("ready", () => {
          const matCache = new MaterialsCache();
          matCache.connect("ready", async () => {
            await godot.yield(this.gameScene.get_tree(), "idle_frame");
            this.network.call_deferred("gameReady");
          });
          this.gameScene.add_child(matCache);
        });

        console.log("pausing");
        //this.get_tree().paused = true;

        const uiScene = UIScene as godot.PackedScene;
        const uiInstance = uiScene.instance() as godot.Spatial;

        const menuNode = this.get_node("/root/Container");
        root.remove_child(menuNode);
        menuNode.call_deferred("free");
        root.call("add_child", uiInstance);

        root.call("add_child", this.gameScene);
        this.network.call("startGame");
      },
      this,
      0.2,
    );
  }
}
