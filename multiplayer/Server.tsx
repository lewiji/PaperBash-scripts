//@ts-ignore
import NetworkPlayerScene from "res://scenes/NetworkPlayer.tscn";
import NetworkPlayer from "../pawn/NetworkPlayer";
import Player from "../pawn/player/Player";
import LoadingScreen from "../ui/Loading";
import Client from "./Client";
import Signalling from "./Signalling";

export default class Server extends godot.Node {
  private players = [];
  private playersReady = [];
  private signalling: Signalling;
  public joinCode: string;

  constructor(code: string) {
    super();
    this.joinCode = code;
  }

  _ready(): void {
    this.set_pause_mode(godot.Node.PAUSE_MODE_PROCESS);
    this.signalling = new Signalling(this, this.joinCode);
    this.add_child(this.signalling);

    this.signalling.connect(this.signalling.player_received, (id) => {
      this.players.push(id);
    });

    this.add_user_signal("startEtVous");

    this.rpc_config("commence", godot.MultiplayerAPI.RPC_MODE_PUPPETSYNC);
    this.rpc_config("playerReady", godot.MultiplayerAPI.RPC_MODE_MASTER);
  }

  async init(): Promise<boolean> {
    godot.randomize();
    this.players.push(1);
    return await this.signalling.init();
  }

  gameReady(): void {
    console.log("host game ready");
    this.playersReady.push(1);
    if (this.players.length === 1) {
      console.log("oh so lonesome");
      this.call_deferred("commence");
    }
  }

  playerReady(id: number): void {
    console.log(`player ${id} game ready`);
    this.playersReady.push(id);
    console.log(this.playersReady);
    console.log(this.players);
    if (
      this.players.every((v) => {
        return this.playersReady.includes(v);
      })
    ) {
      console.log(`all players games ready`);
      this.rpc("commence");
    }
  }

  commence(): void {
    console.log("commencement");
    LoadingScreen._instance.flashMessageAndClose("Connected! Get ready...", 2).then(() => {
      this.emit_signal("startEtVous");
    });
  }

  startGame(): void {
    console.log("host starting");
    this.createSelfPlayer();

    for (const id of this.players) {
      if (id !== this.get_tree().get_network_unique_id()) {
        console.log(id);
        const playerScene = NetworkPlayerScene as godot.PackedScene;
        const newPlayer = playerScene.instance() as NetworkPlayer;
        newPlayer.set_translation(new godot.Vector3(10, 0.6, 10));
        newPlayer.set_name(`NetPlayer${id}`);
        newPlayer.set_network_master(id);

        this.get_node("/root/Spatial/Players").add_child(newPlayer);
      }
    }

    //this.get_tree().paused = false;
  }

  createSelfPlayer(): void {
    const selfPeerID = this.get_tree().get_network_unique_id();
    const hostPlayer = Player._instance;
    hostPlayer.set_name(`NetPlayer${godot.str(selfPeerID)}`);
    hostPlayer.set_network_master(selfPeerID);
  }
}
