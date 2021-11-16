// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// traits.js - convert hash to set of traits
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

const u64  = n => BigInt.asUintN(64, n);
const rotl = (x, k) => u64((x << k) | (x >> (64n - k)));

/**
 * xoshiro is a variation of the shift-register generator, using rotations in
 *   addition to shifts.
 *
 * Algorithm by [Blackmanand Vigna 2018]
 *   https://prng.di.unimi.it/xoshiro256starstar
 *
 */
const xoshiro256strstr = s => () => {
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
const randomDecimal = xss => () => {
  const t = xss();
  return Number(t % 9007199254740991n) / 9007199254740991;
}

//-----------------------------------------------------------------------------

const randomNumber = r => (a, b) => a + (b - a) * r();

//-----------------------------------------------------------------------------

const randomInt = rn => (a, b) => Math.floor(rn(a, b + 1));

//-----------------------------------------------------------------------------

const mkRandom = hash => {
  const s  = Array(4).fill()
    .map((_,i) => i * 16 + 2)
    .map(idx => u64(`0x${hash.slice(idx, idx + 16)}`));
  const xss = xoshiro256strstr(s);
  const r  = randomDecimal(xss);
  const rn = randomNumber(r);
  const ri = randomInt(rn);
  return [r, rn, ri];
};

//-----------------------------------------------------------------------------

const shuffle = (array, r) => {
  let m = array.length, t, i;

  while (m) {
    i = Math.floor(r() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
};

//-----------------------------------------------------------------------------

const repeat = (item, n) => Array.from({length:n}).map(_ => item);

//-----------------------------------------------------------------------------

const selectRandom = (array, r) => array[Math.floor(r() * array.length)];

//-----------------------------------------------------------------------------

const selectRandomDist = (distMap, r) => {
  const keys = Object.keys(distMap)
    .reduce((a, k) => a.concat(repeat(k, distMap[k] * 100)), []);
  return selectRandom(shuffle(keys, r), r);
};

//-----------------------------------------------------------------------------

const getPallet = (palletNum, r) => {
  return String(selectRandom(p[palletNum].split("-"), r)).match(/.{1,3}/g);
};

const getPName = (pNum) => {
  switch (pNum) {
    case 6:
      return "ixchel";
    case 5:
      return "warp";
    case 4:
      return "duraeuropa";
    case 3:
      return "starčevo";
    case 2:
      return "jacquard";
    case 1:
      return "geloma";
  }
}
//-----------------------------------------------------------------------------

// dulls / intensifies a colour by changing its percentage. Wow!
function changeCC(c, prc) {
  if(typeof c !== 'undefined'){
    let sixCol = c.split("").map((it)=>{
      return it + it;
    }).join("");
  
    let rgb = parseInt(sixCol, 16);                 // convert rrggbb to decimal
    let r = ((rgb >> 16) & 0xff) * prc;             // extract red and change prc
    let g = ((rgb >>  8) & 0xff) * prc;             // extract green
    let b = ((rgb >>  0) & 0xff) * prc;             // extract blue
    return color(r,g,b);
  } else {
    return c;
  } 
}

//-----------------------------------------------------------------------------

// on setup, get a random date (deterministic from seed)
function randomDate(start, end, rn) {
  return new Date(start.getTime() + rn * (end.getTime() - start.getTime()));
}

//-----------------------------------------------------------------------------

// define the division data that will be used to generate the loom
function createDvs(rdPal, lineLayers, stX, enX, divNum, ri, rn, r) {
  let dvs = [];
  let cutY = parseInt(lineLayers / divNum);
  let pi = 0;
  let ctXRC = 0;
  let tCl = '000000';

  for (let i = 0; i < divNum; i++) {
    ctXRC = ri(1, 10);
    
    // ensure we cycle through pallette colours, rather than running out if undefined
    if (typeof rdPal[`${i + 1}`] === 'undefined'){
      tCl = rdPal[`${pi}`];
      pi++;
      if ((pi + 1) > rdPal.length) { pi = 0; } // reset pi when at end of pallette to keep looping
    } else {
      tCl = rdPal[`${i + 1}`];
    }

    // determine whether we randomly add a cutX
    if (ctXRC > 4) {
      cutX = rn((stX + 10), (enX - 10));
      colorX = selectRandom(rdPal, r);
      if(ri(1, 10) <= 8){
          ctXst = null; //none
      } else {
        if(ri(1, 10) <= 5){
          ctXst = "3"; //droopy
        } else {
          ctXst = "4"; //pouring
        }
      }
    } else {
      cutX = null;
      colorX = null;
      ctXst = null;
    }

    // push to end of array
    dvs.push({
      cutY,
      color: `#${tCl}`,
      cutX,
      colorX: `#${colorX}`,
      ctXst
    });

    // update string .. if 1 before end, replace with just total number of line layers
    cutY = cutY + parseInt(lineLayers / divNum);
  }
    
  // make sure last element is set to total lineLayers to fix occasional bug
  dvs[divNum - 1].cutY = lineLayers;

  return dvs;
}

//-----------------------------------------------------------------------------
// pallettes
//-----------------------------------------------------------------------------

let p = [];

// geloma - muted, earthy, plain
p[1] = "444ffddb6533233-6548baefbea2b52-9caffce61f93996-69adcbfb7f77a57-eecadb6a9288656-bca8baa87f87ea9-e885449cbceceec-f46f99fcbcca8a9-e57d88ca9cddeed-aecdebfcbfaaf89-533d66fb8fcbedc-7caddbdb6b53334-9dcbdaddafa6643-bdd688222433733-fecd88444999ccc-fecffdcee9dc876-bb9655feb6aaacb-632c85bcadebffc-feccdb976da4fc3-8ca986faafdafea-abaccbeecedbeca-a56ba9ccaedaeeb-545888acbcdaeda-753d87ecaedccdd-977ca9997788576-854dfeffdfddeaa-fd8eedfcafb7f99-444767b88eb9fdb-ffeefdccbdebffd-bdbcdbddbedbfdb-bb8cc8ed9eb8ea8-dca987ddd7659ab-eeacb8665444333";

// jacquard - greeny bluey, nautical
p[2] = "312545898bdaefb-674784bd6eed644-ddbcdb9cc6bb222-223087bd9feac43-acbddce75c44545-eeeddc9cb433c63-1aa543ffefedaba-2369cdeef38ce65-ddc2ac589667534-3322564aa9cadee-5555784aa9dadfb-322433355266188-edccb8066034013-3330660890bc0df-5543339b628a357-2041351657b19c6-4ba7caddaf99f47-ffbaea6ba578525-0683993ba9a2eb1-0ac4bcfeead38b0-2665948c2be0efe-fffce6eed211ce6";

// starčevo - red, or tribal / clashing
p[3] = "313445688ecac24-efcdeb555323914-923eedddaaa6553-9b9fcaf87e46233-697101ba0cb8d35-5358788b9cf8d54-cfdbdb556a56f24-eeecb8b25432110-333feefddfcde36-ce5fff0005be2ad-f44efcce6debeee-eda4208baed9f20-aaac57e15444333-eeeeee333900b00-213e24eebbdc8ba-edb123f35eb4edb-febf84e42312fdb-000912a12233ccc-f342221771bbffc-201600a00b20e40";

// duraeuropa - bright, summery, colorful
p[4] = "423925d84eb5dfc-303404614b44e74-643feb7bae71ea3-8216868a6bb5ec5-fa9e78b68657357-bc5ee8fb4e77a45-ec7d54b24522577-5675cbce6f66c55-543f72cc4eea6b9-fc8f95e64e34388-09a644c34e64ec5-c34d65fb78ac657-534a24d63bc4de4-f55f93fc2ed7dec-7ceaddddce83f60-9dafdafc6fa4e54-c13e72cc0ffb19a-aa4eb3f53c13098-e45f83ee7ffb9cb-bbacb2e73e27333-a06e14f64ed6399-f04f80fb28b00b7-414b15e70fc0891";

// warp - rainbow (rare!);
p[5] = "444000cf0f04401-af0fa0f0aa0f0af";

// ixchel - black and white (rarest!)
p[6] = "000111EEECCCAAA";

//-----------------------------------------------------------------------------
// distributions
//-----------------------------------------------------------------------------

const palletDist = {
  6: .01,
  5: .05,
  4: .11,
  3: .21,
  2: .21,
  1: .41
};

// used for divs, as well as > 9 (21% chances) ie. rotation chance, chaos bg chance, curve chance, slant chance
const divDist = {
  15: .01,
  10: .10,
  9: .10,
  8: .11,
  7: .15,
  6: .15,
  5: .15,
  4: .11,
  3: .06,
  2: .06
}

// string weight
const stWtDist = {
  3: .40,
  2: .60
}
//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------

const hashToTraits = hash => {

  // setup random fns
  const [r, rn, ri] = mkRandom(hash);

  // size / dimension consts
  const cvW = window.innerHeight;
  const cvH = window.innerHeight;
  const stX = cvW * 0.25;     
  const enX = cvW * 0.75;
  const stY = cvH * 0.25;    
  const enY = cvH * 0.75;

  const pNum = parseInt(selectRandomDist(palletDist, r));                                   // pick a random color pallette
  const rdPal = getPallet(pNum, r);
  const rotCh =  parseInt(selectRandomDist(divDist, r)) >= 9 ? true : false;                // 21% chance to randomly rotate the canvas
  const divNum = parseInt(selectRandomDist(divDist, r));                                    // we can have between 2 - 10 (rare ch for 15) color divisions
  const chBGc = parseInt(selectRandomDist(divDist, r));                                     // 21% chance of non-harmonious 'chaos' (any color!) background              
  const bgCl = chBGc < 9                                                            
    ? changeCC(selectRandom(rdPal, r), rn(0.45, 0.75))                                      // define the bg color as either a dulled/lightened color in the pallette,
    : color(ri(0, 255), ri(0, 255), ri(0, 255));                                            // or a 'chaos' color
  const slCh = parseInt(selectRandomDist(divDist, r));
  let slA = 0;                                                                              // default 'slant' angle is endY pos of loom - startY pos of loom / 4,
  const ySlT = (enY - stY) / 4;                                                
  if(slCh > 5) {                                                                            // there's a 50% chance this will get applied
    slA = ySlT;
  }
  const stWt = parseInt(selectRandomDist(stWtDist, r));                                     // the line weight of each strand can be between 2 (stringy) - 3 (solid)
  const cvCh = parseInt(selectRandomDist(divDist, r)) >= 9 ? true : false;                  // 2 in 10 chance of sweeping bezier curves for some divisions
  const rndDy = randomDate(new Date(2012, 0, 1), new Date(), rn(0,1));                      // on a random day/month of the year, the script will slide-animate for the entire day.
  const divs = createDvs(rdPal, (enY - stY), stX, enX, divNum, ri, rn, r);                  // divisions config const

  // adding to tokenState, to help in draw function in art.js
  tokenState.bgCl = bgCl;
  tokenState.rndDy = rndDy;
  tokenState.rotCh = rotCh;

  return {
    rdPal,
    pNum,
    divNum,
    chBGc,
    bgCl,
    slA,
    ySlT,
    stWt,
    cvCh,
    rndDy,
    divs,
    cvW,
    cvH,
    stX,
    enX,
    stY,
    enY
  };

};

