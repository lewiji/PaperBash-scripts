const setInterval = (callback: (args) => void, context: godot.Node, interval: number, ...args: []): godot.Timer => {
  const timer = new godot.Timer();
  timer.set_wait_time(interval);
  timer.set_autostart(true);

  timer.connect(godot.Timer.timeout, () => {
    callback(args);
  });

  context.add_child(timer);

  return timer;
};

export default setInterval;
