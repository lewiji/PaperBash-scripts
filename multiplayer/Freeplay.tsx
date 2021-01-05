//@ts-ignore
import NetworkPlayerScene from "res://scenes/NetworkPlayer.tscn";
import NetworkPlayer from "../pawn/NetworkPlayer";
import Player from "../pawn/player/Player";
//@ts-ignore
import Config from "res://config/config.json";
import LoadingScreen from "../ui/Loading";

export default class Server extends godot.Node {
  private players = [];
  private playersReady = [];
  private signalling: godot.NetworkedMultiplayerENet;;
  public joinCode: string;

  constructor(code: string) {
    super();
    this.joinCode = code;
  }

  _ready(): void {
    this.set_pause_mode(godot.Node.PAUSE_MODE_PROCESS);
    this.signalling = new godot.NetworkedMultiplayerENet();

    this.add_user_signal("startEtVous")

    this.rpc_config("commence", godot.MultiplayerAPI.RPC_MODE_PUPPETSYNC);
    this.rpc_config("playerReady", godot.MultiplayerAPI.RPC_MODE_MASTER);
  }

  async init(): Promise<boolean> {
    godot.randomize();
    const result = this.signalling.create_server(Config.PORT, 8);
    if (result === godot.OK) {
      console.log("Server created");
      this.get_tree().network_peer = this.signalling;
      this.players.push(this.get_tree().get_network_unique_id());
      this.registerOnPeerConnected();
    } else {
      this.get_tree().network_peer = null;
      console.log("itsa failya");
      this.signalling = undefined;
      return false;
    }

    godot.randomize();
    return true;
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
    //this.get_tree().paused = false;
    LoadingScreen._instance.hide();
    this.emit_signal("startEtVous");
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

  registerOnPeerConnected(): void {
    this.get_tree().connect("network_peer_connected", (id) => {
      console.log(`${id} connected`);

      this.rpc("receivePlayers", this.players);
      this.players.push(id);
    });
  }

  createSelfPlayer(): void {
    const selfPeerID = this.get_tree().get_network_unique_id();
    const hostPlayer = Player._instance;
    hostPlayer.set_name(`NetPlayer${godot.str(selfPeerID)}`);
    hostPlayer.set_network_master(selfPeerID);
  }

  registerOnPeerDisconnected(): void {
    this.get_tree().connect("network_peer_disconnected", (id) => {
      console.log(`${id} disconnected`);
      this.players = this.players.filter((p) => p !== id);
      this.get_node(`/root/Spatial/Players/NetPlayer${id}`).queue_free();
    });
  }
}
