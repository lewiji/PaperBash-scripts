function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  getRandomValuesWithMathRandom(bytes);
  return bytes;
}

function getRandomValuesWithMathRandom(bytes: Uint8Array): void {
  const max = Math.pow(2, (8 * bytes.byteLength) / bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.random() * max;
  }
}

function hex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

// https://tools.ietf.org/html/rfc4122
export function generateUUIDv4(): string {
  const bytes = getRandomBytes(16);

  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version
  bytes[8] = (bytes[8] & 0xbf) | 0x80; // variant

  return (
    hex(bytes.subarray(0, 4)) +
    "-" +
    hex(bytes.subarray(4, 6)) +
    "-" +
    hex(bytes.subarray(6, 8)) +
    "-" +
    hex(bytes.subarray(8, 10)) +
    "-" +
    hex(bytes.subarray(10, 16))
  );
}
