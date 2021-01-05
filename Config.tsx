export default class Config extends godot.Node {
  public static _instance: Config;

  configData = {
    headId: 0,
    bodyId: 0,
    playerName: "",
  };

  configPath = "user://config.json";

  constructor() {
    super();
    if (Config._instance === undefined) {
      Config._instance = this;
      const file = new godot.File();
      if (file.file_exists(this.configPath)) {
        console.log("config found");
        file.open(this.configPath, godot.File.READ);
        const content = JSON.parse(file.get_as_text());
        file.close();
        this.configData = content;
      }
    } else {
      return Config._instance;
    }
  }

  get(key: string): unknown {
    return this.configData[key];
  }

  set(key: string, value: unknown): void {
    this.configData[key] = value;
    const file = new godot.File();
    file.open(this.configPath, godot.File.WRITE);
    file.store_string(JSON.stringify(this.configData));
    file.close();
  }
}
