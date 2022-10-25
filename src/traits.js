// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// traits.js - convert hash to set of traits
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// FXHASH SPECIFIC :)
//-----------------------------------------------------------------------------
// Bitcoin Base58 encoder/decoder algorithm
const btcTable = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
console.assert(btcTable.length === 58);

// Base58 decoder/encoder for BigInt
function b58ToBi(chars, table = btcTable) {
  const carry = BigInt(table.length);
  let total = 0n,
    base = 1n;
  for (let i = chars.length - 1; i >= 0; i--) {
    const n = table.indexOf(chars[i]);
    if (n < 0) throw TypeError(`invalid letter contained: '${chars[i]}'`);
    total += base * BigInt(n);
    base *= carry;
  }
  return total;
}

const mkRandom = (hash) => {
  const s = Array(4)
    .fill()
    .map((_, i) => i * 12.75 + 2)
    .map((idx) => b58ToBi(hash.slice(idx, idx + 12.75), btcTable));
  const xss = xoshiro256strstr(s);
  const r = randomDecimal(xss);
  const rn = randomNumber(r);
  const ri = randomInt(rn);
  return [r, rn, ri];
};

//-----------------------------------------------------------------------------
// other possibly helpful functions
//-----------------------------------------------------------------------------

const u64 = (n) => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));

/**
 * xoshiro is a variation of the shift-register generator, using rotations in
 *   addition to shifts.
 *
 * Algorithm by [Blackmanand Vigna 2018]
 *   https://prng.di.unimi.it/xoshiro256starstar
 *
 */
const xoshiro256strstr = (s) => () => {
  const result = u64(rotl(u64(s[1] * 5n), 7n) * 9n);

  let t = u64(s[1] << 17n);

  s[2] ^= s[0];
  s[3] ^= s[1];
  s[1] ^= s[2];
  s[0] ^= s[3];

  s[2] ^= t;

  s[3] = rotl(s[3], 45n);

  return result;
};

//-----------------------------------------------------------------------------

/**
 * Returns a float between [0, 1) (inclusive of 0, exclusive of 1).
 */
const randomDecimal = (xss) => () => {
  const t = xss();
  return Number(t % 9007199254740991n) / 9007199254740991;
};

//-----------------------------------------------------------------------------

const randomNumber = (r) => (a, b) => a + (b - a) * r();

//-----------------------------------------------------------------------------

const randomInt = (rn) => (a, b) => Math.floor(rn(a, b + 1));

//-----------------------------------------------------------------------------

function medianOfInt(value) {
  var half = Math.floor(value / 2);

  if (value % 2) return half;

  return (half - 1 + half) / 2.0;
}
//-----------------------------------------------------------------------------

const shuffle = (array, r) => {
  let m = array.length,
    t,
    i;

  while (m) {
    i = Math.floor(r() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

//-----------------------------------------------------------------------------

const repeat = (item, n) => Array.from({ length: n }).map((_) => item);

//-----------------------------------------------------------------------------

const selectRandom = (array, r) => array[Math.floor(r() * array.length)];

//-----------------------------------------------------------------------------

const selectRandomDist = (distMap, r) => {
  const keys = Object.keys(distMap).reduce(
    (a, k) => a.concat(repeat(k, distMap[k] * 100)),
    []
  );
  return selectRandom(shuffle(keys, r), r);
};

//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------

const hashToTraits = (hash) => {
  // so it SEEMS as if every time r is referenced.. like in a loop, etc... it changes the seed-determined outcome of all r's? I guess?
  // so in other words, if you call r in any sort of loop that can possibly CHANGE (like, allowedCircles-based loop), then we will always have non-deterministic results on page reloads or whatever thing
  // that can CHANGE on each reload.
  // so basically, DON'T DO THAT.

  // setup random fns
  const [r, rn, ri] = mkRandom(hash);

  const cvW = windowWidth;
  const cvH = windowHeight;

  return {
    cvW,
    cvH,
  };
};
