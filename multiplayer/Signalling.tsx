import Server from "./Server";
import Client from "./Client";
// @ts-ignore
import Config from "res://config/config.json";

export default class Signalling extends godot.Node {
  public wrtc_mp: godot.WebRTCMultiplayer;
  private wsClient: godot.WebSocketClient;
  private peerId: number;
  private network: Client | Server;
  private serverCode: number;
  public player_received = "player_received";
  private certificate: godot.X509Certificate;

  constructor(network, serverCode) {
    super();
    this.network = network;
    this.serverCode = serverCode;
  }

  _ready() {

    this.certificate = new godot.X509Certificate();
    this.certificate.load("res://config/ca-certificates.crt");
    this.add_user_signal(this.player_received);
    this.wrtc_mp = new godot.WebRTCMultiplayer();
    this.wsClient = new godot.WebSocketClient();

    this.wrtc_mp.connect("connection_succeeded", () => {
      console.log("connection succeeded");
    });

    this.wsClient.connect("connection_established", () => {
      console.log("established connection to lobby server");
      const peer = this.wsClient.get_peer(1);
      peer.set_write_mode(godot.WebSocketPeer.WRITE_MODE_TEXT);
      this.wsClient.get_peer(1).put_var(String(`J: ${this.serverCode}\n`).normalize());
    });

    this.wsClient.connect("data_received", () => {
      const pkt: string = this.wsClient.get_peer(1).get_packet().get_string_from_utf8();
      const type = pkt.split(": ")[0];
      let req = pkt.substr(3);

      if (type.length !== 1) {
        console.log("invalid type size");
        return;
      }

      const data = req;

      if (type === "J") {
        console.log("lobby_joined");
      } else if (type === "S") {
        console.log("lobby_sealed");
      } else if (type === "I") {
        console.log("self-peer received");
        this.peerId = Number.parseInt(data);
        this.wrtc_mp.initialize(this.peerId, true);
        this.get_tree().network_peer = this.wrtc_mp;
      } else if (type === "N") {
        console.log("peer received");
        this.onPeerReceived(Number.parseInt(data));
      } else if (type === "D") {
        console.log("peer disconnected");
        this.onPeerDisconnected(Number.parseInt(data));
      } else if (type === "O") {
        console.log("offer received");
        const id = data.split("\n")[0];
        const offer = data.substring(data.indexOf("\n") + 1);
        this.offer_received(Number.parseInt(id), offer);
      } else if (type === "A") {
        console.log("answer received");
        const id = data.split("\n")[0];
        const answer = data.substring(data.indexOf("\n") + 1);
        this.answer_received(Number.parseInt(id), answer);
      } else if (type === "C") {
        console.log(data);
        console.log("candidate received");
        const split = req.split(/\r\n|\n|\r/);
        const candidate = [split[2], split[3], split[4]];
        if (candidate.length !== 3) return;
        if (parseInt(candidate[1]) === undefined) return;
        this.candidate_received(Number.parseInt(split[0]), candidate[0], Number.parseInt(candidate[1]), candidate[2]);
      }
    });

    this.wsClient.connect("connection_closed", () => {
      console.log("connection_closed");
      this.get_tree().network_peer = null;
      this.wrtc_mp = undefined;
      return false;
    });

    this.wsClient.connect("connection_error", () => {
      console.log("connection failed");
      this.get_tree().network_peer = null;
      this.wrtc_mp = undefined;
      return false;
    });

    this.wsClient.connect("server_close_request", () => {
      console.log("server_close_request");
    });
  }

  _process(): void {
    const status = this.wsClient.get_connection_status();
    if (
      status === godot.NetworkedMultiplayerPeer.CONNECTION_CONNECTING ||
      status === godot.NetworkedMultiplayerPeer.CONNECTION_CONNECTED
    ) {
      this.wsClient.poll();
      this.wrtc_mp.poll();
    }
  }

  async init(): Promise<boolean> {
    this.wsClient.set_verify_ssl_enabled(true);
    this.wsClient.set_trusted_ssl_certificate(this.certificate);
    const result = this.wsClient.connect_to_url(`${Config.API_URL}:9080`);
    console.log(`Connection status: ${result}`)
    return result === godot.OK;
  }

  offer_received(id, offer) {
    console.log(`Got offer ${id}`);
    if (this.wrtc_mp.has_peer(id)) {
      this.wrtc_mp.get_peer(id)["connection"].set_remote_description("offer", offer);
    }
  }

  answer_received(id, answer) {
    console.log(`Got answer ${id}`);
    if (this.wrtc_mp.has_peer(id)) {
      this.wrtc_mp.get_peer(id)["connection"].set_remote_description("answer", answer);
    }
  }

  candidate_received(id, mid, index, sdp) {
    console.log(`Got candidate ${id}`);
    if (this.wrtc_mp.has_peer(id)) {
      this.wrtc_mp.get_peer(id)["connection"].add_ice_candidate(mid, index, sdp);
      this.emit_signal(this.player_received, id);
    }
  }

  send_msg(type, id, data) {
    return this.wsClient.get_peer(1).put_var(String(`${type}: ${id}\n${data}`));
  }

  send_offer(id, offer) {
    return this.send_msg("O", id, offer);
  }

  send_answer(id, answer) {
    return this.send_msg("A", id, answer);
  }

  send_candidate(id, mid, index, sdp) {
    return this.send_msg("C", id, `\n${mid}\n${index}\n${sdp}`);
  }

  onPeerReceived(id: number): godot.WebRTCPeerConnection {
    console.log(`${id} connected`);

    const webWrapper = this.get_node("/root/WebrtcWrapper");

    const peer = webWrapper.call("initialize", { iceServers: [{ urls: [`stun:${Config.API_URL}:3478`] }] });
    this.wrtc_mp.add_peer(peer, id);

    peer.connect("session_description_created", (type, data) => {
      if (!this.wrtc_mp.has_peer(id)) {
        return;
      }
      console.log("created", type);
      this.wrtc_mp.get_peer(id)["connection"].set_local_description(type, data);

      if (type === "offer") {
        return this.send_offer(id, data);
      } else {
        this.send_answer(id, data);
      }
    });
    peer.connect("ice_candidate_created", (mid_name, index_name, sdp_name) => {
      this.send_candidate(id, mid_name, index_name, sdp_name);
    });

    if (id > this.wrtc_mp.get_unique_id()) {
      peer.call("create_offer");
    }
    return peer as godot.WebRTCPeerConnection;
  }

  onPeerDisconnected(id) {
    console.log("shit");
  }
}
