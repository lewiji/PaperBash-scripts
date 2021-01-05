//@ts-ignore
import NetworkPlayerScene from "res://scenes/NetworkPlayer.tscn";
import NetworkPlayer from "../pawn/NetworkPlayer";
import Player from "../pawn/player/Player";
//@ts-ignore
import Config from "res://config/config.json";
import LoadingScreen from "../ui/Loading";
import Signalling from "./Signalling";

export default class Client extends godot.Node {
  private players: Array<number>;
  private serverCode: string;
  private signalling: Signalling;

  constructor(serverCode: string) {
    super();
    this.players = [];
    this.serverCode = serverCode;
  }

  _ready(): void {
    this.signalling = new Signalling(this, this.serverCode);
    this.add_child(this.signalling);
    this.signalling.connect(this.signalling.player_received, (id) => {
      this.players.push(id);
    });
    

    this.set_pause_mode(godot.Node.PAUSE_MODE_PROCESS);
    this.rpc_config("commence", godot.MultiplayerAPI.RPC_MODE_PUPPET);
  }

  async init(): Promise<boolean> {
    godot.randomize();
    return await this.signalling.init();
  }

  gameReady(): void {
    this.rpc_id(1, "playerReady", this.get_tree().get_network_unique_id());
  }

  commence(): void {
    console.log("commenncement");
    LoadingScreen._instance.flashMessageAndClose("Connected! Get ready...", 2).then(() => {
      //this.get_tree().paused = false;
    });
  }

  startGame(): void {
    LoadingScreen._instance.show("Waiting for players...");
    const myPlayer = Player._instance;
    myPlayer.set_network_master(this.get_tree().get_network_unique_id());
    myPlayer.set_name(`NetPlayer${this.get_tree().get_network_unique_id()}`);
    for (const playerId of this.players) {
      if (playerId === this.get_tree().get_network_unique_id()) return;
      const newPlayer = NetworkPlayerScene.instance() as NetworkPlayer;
      newPlayer.set_translation(new godot.Vector3(10, 0.6, 10));
      newPlayer.set_name(`NetPlayer${playerId}`);
      newPlayer.set_network_master(playerId);

      this.get_node("/root/Spatial/Players").add_child(newPlayer);
    }
  }
}
