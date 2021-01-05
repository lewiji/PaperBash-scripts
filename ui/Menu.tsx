//@ts-ignore
import CharacterSelectorScene from "res://scenes/CharacterSelect.tscn";
//@ts-ignore
import LoadingScreen from "res://scenes/Loading.tscn";

import Server from "../multiplayer/Server";
import Client from "../multiplayer/Client";
import Freeplay from "../multiplayer/Freeplay";
import CharacterSelector from "./CharacterSelector";
import Loading from "./Loading";
import fetch from "../util/fetch";
// @ts-ignore
import Config from "res://config/config.json";
import { node } from "../decorators";

export default class Menu extends godot.Control {
  @node
  private btnServer: godot.Button;
  @node
  private btnClient: godot.Button;
  @node
  private inputCode: godot.LineEdit;
  @node
  private btnFreeplay: godot.Button;

  _ready(): void {
    //this.addLoadingScreenToRoot();
    fetch(`https://${Config.API_URL}/api`, this)
      .then((value) => {
        const res = value.result;
        console.log(res.apiVersion);
      })
      .catch((e) => {
        console.log(e);
      });

    this.btnServer.connect("pressed", () => {
      console.log("server...");
      Loading._instance.show();
      fetch(`https://${Config.API_URL}/api/games/new`, this)
        .then((value) => {
          const res = value.result;
          console.log(res.data.code);
          if (res.data.code) {
            this.createCharacter(new Server(res.data.code));
          } else {
            this.failedToConnect();
          }
        })
        .catch((e) => {
          console.log(e);
          this.failedToConnect();
        });
    });

    this.btnFreeplay.connect("pressed", () => {
      this.createCharacter(new Freeplay("freeplay_mode"));
    });

    this.inputCode.connect(godot.LineEdit.text_changed, () => {
      if (this.inputCode.get_text() !== "") {
        this.inputCode.set_text(this.inputCode.get_text().toUpperCase());
        this.inputCode.set_cursor_position(9999);
        this.btnClient.set_disabled(false);
      } else {
        this.btnClient.set_disabled(true);
      }
    });
    /* This is all fucked like on azzadroid
    this.inputCode.connect("text_entered", () => {
      if (this.btnClient.is_disabled()) {
        return;
      }
      this.connectClient();
    });*/

    this.btnClient.connect("pressed", () => {
      this.connectClient();
    });
  }

  addLoadingScreenToRoot(): godot.CanvasLayer {
    const loaderScene = LoadingScreen as godot.PackedScene;
    const loader = loaderScene.instance() as godot.CanvasLayer;
    this.get_tree().get_root().call("add_child", loader);
    return loader;
  }

  failedToConnect(): void {
    Loading._instance.flashMessageAndClose("Failed to connect :(").then(() => {
      this.btnClient.set_disabled(false);
      this.inputCode.set_editable(true);
    });
  }

  connectClient(): void {
    console.log("client...");
    const serverCode = this.inputCode.get_text();
    this.btnClient.set_disabled(true);
    this.inputCode.set_editable(false);
    Loading._instance.show();
    fetch(`https://${Config.API_URL}/api/games/join/${serverCode.toUpperCase()}`, this, true)
      .then((value) => {
        const res = value.result;
        if (res.data.code) {
          this.createCharacter(new Client(serverCode));
        } else {
          this.failedToConnect();
        }
      })
      .catch((e) => {
        console.log(e);
        this.failedToConnect();
      });
  }

  async createCharacter(network: godot.Node): Promise<void> {
    const root = this.get_tree().get_root();
    const characterScene = CharacterSelectorScene as godot.PackedScene;
    const instance = characterScene.instance() as CharacterSelector;

    const menuNode = this.get_node("/root/Control") as godot.Control;
    //menuNode.hide();

    network.set_name("Network");
    this.get_tree().get_root().add_child(network);
    const cast_net = network as Server | Client | Freeplay;
    const connected = await cast_net.init();
    if (connected) {
      root.remove_child(menuNode);
      menuNode.call_deferred("free");
      root.call_deferred("add_child", instance);
      instance.call_deferred("initNetwork", network);
    } else {
      Loading._instance.flashMessageAndClose("Connection failed :(", 2);
      //menuNode.show();
      network.queue_free();
      console.log("oopsy");
    }
  }
}
