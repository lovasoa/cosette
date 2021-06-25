const ALGO_TAGS: [string, number][] = [
  ["RS512", -259],
  ["RS384", -258],
  ["RS256", -257],
  ["ES512", -36],
  ["ECDH-SS-512", -28],
  ["ECDH-SS", -27],
  ["ECDH-ES-512", -26],
  ["ECDH-ES", -25],
  ["ES256", -7],
  ["direct", -6],
  ["A128GCM", 1],
  ["A192GCM", 2],
  ["A256GCM", 3],
  ["SHA-256_64", 4], ["SHA-256-64", 4], ["HS256/64", 4],
  ["SHA-256", 5], ["HS256", 5],
  ["SHA-384", 6], ["HS384", 6],
  ["SHA-512", 7], ["HS512", 7],
  ["AES-CCM-16-64-128", 10], ["AES-CCM-16-128/64", 10],
  ["AES-CCM-16-64-256", 11], ["AES-CCM-16-256/64", 11],
  ["AES-CCM-64-64-128", 12], ["AES-CCM-64-128/64", 12],
  ["AES-CCM-64-64-256", 13], ["AES-CCM-64-256/64", 13],
  ["AES-MAC-128/64", 14],
  ["AES-MAC-256/64", 15],
  ["AES-MAC-128/128", 25],
  ["AES-MAC-256/128", 26],
  ["AES-CCM-16-128-128", 30], ["AES-CCM-16-128/128", 30],
  ["AES-CCM-16-128-256", 31], ["AES-CCM-16-256/128", 31],
  ["AES-CCM-64-128-128", 32], ["AES-CCM-64-128/128", 32],
  ["AES-CCM-64-128-256", 33], ["AES-CCM-64-256/128", 33]
];

const AlgToTags = new Map(ALGO_TAGS);
const AlgFromTagsMap = new Map(ALGO_TAGS.map(([alg, tag]) => [tag, alg]));

export function AlgFromTags(tag: number): string {
  const cose_name = AlgFromTagsMap.get(tag);
  if (!cose_name) throw new Error('Unknown algorithm, ' + tag);
  return cose_name;
}

const Translators = {
  kid: value => new TextEncoder().encode(value).buffer,
  alg: (value) => {
    if (!AlgToTags.has(value)) throw new Error('Unknown \'alg\' parameter, ' + value);
    return AlgToTags.get(value);
  }
};

export const HeaderParameters = {
  partyUNonce: -22,
  static_key_id: -3,
  static_key: -2,
  ephemeral_key: -1,
  alg: 1,
  crit: 2,
  content_type: 3,
  ctyp: 3, // one could question this but it makes testing easier
  kid: 4,
  IV: 5,
  Partial_IV: 6,
  counter_signature: 7
};

export type HeaderValue = string | Buffer | number;
export type HeaderType = { [T in keyof typeof HeaderParameters]?: HeaderValue }
export interface HeaderPU { p: HeaderType, u: HeaderType };

export const EMPTY_BUFFER = new ArrayBuffer(0);

export function TranslateHeaders(header: HeaderType): Map<number, HeaderValue> {
  const result = new Map();
  for (const param in header) {
    if (!HeaderParameters[param]) {
      throw new Error('Unknown parameter, \'' + param + '\'');
    }
    let value = header[param];
    if (Translators[param]) {
      value = Translators[param](header[param]);
    }
    if (value !== undefined && value !== null) {
      result.set(HeaderParameters[param], value);
    }
  }
  return result;
};

const KeyParameters = {
  crv: -1,
  k: -1,
  x: -2,
  y: -3,
  d: -4,
  kty: 1
};

const KeyTypes = {
  OKP: 1,
  EC2: 2,
  RSA: 3,
  Symmetric: 4
};

const KeyCrv = {
  'P-256': 1,
  'P-384': 2,
  'P-521': 3,
  X25519: 4,
  X448: 5,
  Ed25519: 6,
  Ed448: 7
};

const KeyTranslators = {
  kty: (value) => {
    if (!(KeyTypes[value])) {
      throw new Error('Unknown \'kty\' parameter, ' + value);
    }
    return KeyTypes[value];
  },
  crv: (value) => {
    if (!(KeyCrv[value])) {
      throw new Error('Unknown \'crv\' parameter, ' + value);
    }
    return KeyCrv[value];
  }
};

export function TranslateKey(key) {
  const result = new Map();
  for (const param in key) {
    if (!KeyParameters[param]) {
      throw new Error('Unknown parameter, \'' + param + '\'');
    }
    let value = key[param];
    if (KeyTranslators[param]) {
      value = KeyTranslators[param](value);
    }
    result.set(KeyParameters[param], value);
  }
  return result;
};

export function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  const buffer = new Uint8Array(Math.max(a.length, b.length));
  for (let i = 1; i <= buffer.length; ++i) {
    const av = (a.length - i) < 0 ? 0 : a[a.length - i];
    const bv = (b.length - i) < 0 ? 0 : b[b.length - i];
    buffer[buffer.length - i] = av ^ bv;
  }
  return buffer;
};


export function runningInNode() {
  return Object.prototype.toString.call(global.process) === '[object process]';
};


export function uint8ArrayEquals(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => b[i] === v);
}