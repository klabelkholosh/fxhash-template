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
// pallettes
//-----------------------------------------------------------------------------

let p = [];

p[1] = 'cfe688222433733';

p[2] = '223087bd9feac43';

p[3] = '313445688ecac24';

p[4] = '643feb7bae71ea3';

p[5] = '185e2235aed6e89';

p[6] = '000111EEECCCAAA';

//-----------------------------------------------------------------------------
// functions used in random hash variables!
//-----------------------------------------------------------------------------

// grab a random BG colour, from our defined pallette
function getBG(rdPal, r1, rn, ri) {
  let bgCl = 0;
  bgCl = changeCC(selectRandom(rdPal, r1), rn(0.45, 0.75));

  // check for not too similar to anything else in palette, otherwise crank up the brightness

  rdPal.map((p) => {
    let cPd = parseInt(xpPal(p), 16),
      l1 = bgCl.levels[0],
      l2 = bgCl.levels[1],
      l3 = bgCl.levels[2]; // convert rrggbb to decimal
    let rmean = (((cPd >> 16) & 0xff) + l1) / 2;
    let r = ((cPd >> 16) & 0xff) - l1; // extract red and change prc
    let g = ((cPd >> 8) & 0xff) - l2; // extract green
    let b = ((cPd >> 0) & 0xff) - l3; // extract blue
    if (
      sqrt(
        (((512 + rmean) * r * r) >> 8) +
          4 * g * g +
          (((767 - rmean) * b * b) >> 8)
      ) < 15
    ) {
      // 15 seems to be a good level of similarity.. below, too similar
      if (l1 === 0) {
        l1 = 255;
        l2 = 255;
        l3 = 255;
      } // extremely rare chance with ixchel with black bg & black other to not blend, therefore set to grey
      bgCl = changeCC([toHex(l1), toHex(l2), toHex(l3)].join(''), 0.5);
    }
  });

  return bgCl;
}

const getPallet = (palletNum, r) => {
  //return String(selectRandom(p[palletNum].split("-"), r)).match(/.{1,3}/g);
  let palStr = String(selectRandom(p[palletNum].split('-'), r));
  console.log('pal:', palStr);
  return palStr.match(/.{1,3}/g);
};

// dulls / intensifies a colour by changing its percentage. Wow!
function changeCC(c, prc) {
  if (typeof c !== 'undefined') {
    let xP, rgb, r, g, b;
    if (typeof c !== 'object') {
      xP = xpPal(c);
      rgb = parseInt(xP, 16); // convert rrggbb to decimal
      r = ((rgb >> 16) & 0xff) * prc; // extract red and change prc
      g = ((rgb >> 8) & 0xff) * prc; // extract green
      b = ((rgb >> 0) & 0xff) * prc; // extract blue
    } else {
      r = c.levels[0] * prc; // extract red and change prc
      g = c.levels[1] * prc; // extract green
      b = c.levels[2] * prc; // extract blue
    }
    return color(r, g, b);
  } else {
    return c;
  }
}

// expand palette from 3-char colours to 6-char colours
const xpPal = (p) =>
  p
    .split('')
    .map((it) => it + it)
    .join('');

// func for returning a color to be used in art.js random func
const retCl = (p) => color('#' + xpPal(p));

const toHex = (x) => x.toString(16).padStart(2, '0');

// random palette distributions - how likely we are to use a type of pallete
const palletDist = {
  6: 0.01,
  5: 0.09,
  4: 0.1,
  3: 0.2,
  2: 0.2,
  1: 0.4,
};

//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------

const hashToTraits = (hash) => {
  // setup random fns - this uses the random hash to generate random number constants, that are used to create random traits that are tied to the hash used
  const [r, rn, ri] = mkRandom(hash);

  const cvW = windowWidth;
  const cvH = windowHeight;

  // randomly (but weighed according to 'palletDist' above), get a number between 1 and 6, which represents the palette to be used from the palette array, then
  // get palette using number (this is 'random', but all tied to the hash)
  const pNum = parseInt(selectRandomDist(palletDist, r));
  const randPal = getPallet(pNum, r);

  // get a background color from the above pallette (once again, randomly, but tied to the hash)
  const bgCol = getBG(randPal, r, rn, ri);

  return {
    cvW,
    cvH,
    randPal,
    bgCol,
  };
};

// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// boot.js - bootstrap script with global data
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// testing
//-----------------------------------------------------------------------------

const randomHash = size => {
  const digits = "0123456789abcdef";
  return '0x' + [...Array(size).keys()]
    .map(() => digits[Math.floor(Math.random() * digits.length)])
    .join('');
};

//-----------------------------------------------------------------------------
// globals
//-----------------------------------------------------------------------------

const tokenData = {
  projectId: 1,
  tokenId: 1,
  hash: randomHash(64)
};

//-----------------------------------------------------------------------------
// flatA = flattenAngle, lnThk = lineThickness, flutA = flutterAdd
const tokenState = {
  lnThk: "0",
  flutA: "0",
  moving: "true"
};

// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// index.js - handle testing state controls
//-----------------------------------------------------------------------------

/**
 * Handle paused, flutter and line thickness state change.
 */

const onChangeMoving = checked => {
  tokenState.moving = checked;
};

const onChangeFlutA = value => {
  tokenState.flutA = parseInt(value);
};

const onChangeLnThk = value => {
  tokenState.lnThk = parseInt(value);
};

const onMousSldrTog = () => {
  if(!document.getElementById('moving').checked) {
    tokenState.moving = !tokenState.moving;
  }
};

//-----------------------------------------------------------------------------
// art.js - art generation
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------
//
// CHECK EVERYTHING MARKED AS  //FXHash!! , as this is FXHash specific stuff :)
//

let fxPrevOccurred = false;

function setup() {
  //FXHash!!
  //----------
  hash = fxhash; // this is the random hash, different every page refresh (basically different for every generated artwork), script can use this hash to do random generations
  console.log('hash:', hash);
  randomSeed(hash);
  noiseSeed(hash);
  //----------

  let { cvW, cvH, randPal, bgCol } = hashToTraits(hash);

  //FXHash!! - here define the token features
  window.$fxhashFeatures = {
    someCoolFeature1: '1',
    someCoolRarityFeature2: '2',
  };

  // default frame-rate is 8
  frameRate(8);

  // create canvas
  createCanvas(cvW, cvH);

  //-------------------------------------
  // actually draw some stuff...  you can do this here in setup() (which is a once-off draw) or in draw() (which will draw something every frame - animations, etc.)
  //-------------------------------------
  // set background colour from our random bg color in traits.js
  background(bgCol);

  // draw a damn square
  square(20, 20, 50);

  //-------------------------------------

  //FXHash!! - when to take a snapshot of your script for a preview image on Fxhash site
  if (!fxPrevOccurred) {
    fxpreview();
    fxPrevOccurred = true;
  }
}

/**
 * Draw is required to be defined for processing library to load into the
 *  global scope.
 */
function draw() {}
