const fetch = (url: string, context: godot.Node, post = false, data = ""): Promise<godot.JSONParseResult> => {
  return new Promise((resolve, reject) => {
    const HTTPRequest = new godot.HTTPRequest();
    context.add_child(HTTPRequest);
    console.log(url);
    HTTPRequest.connect("request_completed", (result, status, headers, body) => {
      //console.log(body.get_string_from_utf8());
      console.log(status);
      const parsedJson = godot.JSON.parse(body.get_string_from_utf8());
      if (parsedJson.get_result() === null || status === 500) {
        reject(`[${status}] ${result}`);
      } else {
        resolve(godot.JSON.parse(body.get_string_from_utf8()));
      }
      HTTPRequest.queue_free();
    });

    HTTPRequest.request(
      url,
      new godot.PoolStringArray(),
      true,
      post ? godot.HTTPClient.METHOD_POST : godot.HTTPClient.METHOD_GET,
      data ? JSON.stringify(data) : "",
    );
  });
};

export default fetch;
