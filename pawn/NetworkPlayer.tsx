import Player from "./player/Player";

/**
 * NetworkPlayer overrides base player to remove input functions and receive RPCs only
 */
export default class NetworkPlayer extends Player {
  constructor() {
    super(true);
  }

  // Called when the node enters the scene tree for the first time.
  _ready(): void {
    this.rpc_config("updatePosRot", godot.MultiplayerAPI.RPC_MODE_REMOTE);
    this.rpc_config("net_attack", godot.MultiplayerAPI.RPC_MODE_REMOTE);
    this.rpc_config("invokeAttackCommand", godot.MultiplayerAPI.RPC_MODE_REMOTESYNC);
    this.rpc_config("takeDamage", godot.MultiplayerAPI.RPC_MODE_PUPPETSYNC);

    this.rset_config("headId", godot.MultiplayerAPI.RPC_MODE_REMOTE);
    this.rset_config("bodyId", godot.MultiplayerAPI.RPC_MODE_REMOTE);
    this.rset_config("playerName", godot.MultiplayerAPI.RPC_MODE_REMOTE);
  }

  _physics_process(): void {
    return;
  }

  _input(): void {
    return;
  }

  handleMovementInput(): godot.Vector3 {
    return this.movement;
  }

  rotateAndCalculateMovement(): godot.Vector3 {
    return super.rotateAndCalculateMovement();
  }

  handleJumps(): number {
    const jumpStrength = 0;
    return jumpStrength;
  }
}
