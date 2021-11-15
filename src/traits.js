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

const getPallet = (pallettes, r) => {
  return String(selectRandom(pallettes, r)).match(/.{1,3}/g);
};

//-----------------------------------------------------------------------------

// dulls / intensifies a colour by changing its percentage. Wow!
function changeCC(c, prc) {
  if(typeof c !== 'undefined'){
    let sixCol = c.split("").map((it)=>{
      return it + it;
    }).join("");
  
    let rgb = parseInt(sixCol, 16);                  // convert rrggbb to decimal
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

// define the division data that will be used to generate the portal
function createDvs(rdPal, lineLayers, pStartX, pEndX, divNum, ri, rn, r) {
  let dvs = [];
  let runningCut = parseInt(lineLayers / divNum);
  let pi = 0;
  let ctXRC = 0;
  let tempColor = '000000';

  for (let i = 0; i < divNum; i++) {
    ctXRC = ri(1, 10);
    
    // ensure we cycle through pallette colours, rather than running out if undefined
    if (typeof rdPal[`${i + 1}`] === 'undefined'){
      tempColor = rdPal[`${pi}`];
      pi++;
      if ((pi + 1) > rdPal.length) { pi = 0; } // reset pi when at end of pallette to keep looping
    } else {
      tempColor = rdPal[`${i + 1}`];
    }

    // determine whether we randomly add a cutX
    if (ctXRC > 4) {
      cutX = rn((pStartX + 10), (pEndX - 10));
      colorX = selectRandom(rdPal, r);
      if(ri(1, 10) <= 8){
          cutXstyle = null; //none
      } else {
        if(ri(1, 10) <= 5){
          cutXstyle = "3"; //droopy
        } else {
          cutXstyle = "4"; //pouring
        }
      }
    } else {
      cutX = null;
      colorX = null;
      cutXstyle = null;
    }
    
    let tempObj = {
      cutY: runningCut,
      color: `#${tempColor}`,
      cutX: cutX,
      colorX: `#${colorX}`,
      cutXstyle: cutXstyle
    };

    // push to end of array
    dvs.push(tempObj);

    // update string .. if 1 before end, replace with just total number of line layers
    runningCut = runningCut + parseInt(lineLayers / divNum);
  }
    
  // make sure last element is set to total lineLayers to fix occasional bug
  dvs[divNum - 1].cutY = lineLayers;

  return dvs;
}

//-----------------------------------------------------------------------------
// pallettes
//-----------------------------------------------------------------------------

let pallettes = "dca987ddd7659ab-fffce6eed211ce6-efcdeb555323914-313445688ecac24-543f72cc4eea6b9-545888acbcdaeda-8216868a6bb5ec5-fc8f95e64e34388-f44efcce6debeee-fa9e78b68657357-ce5fff0005be2ad-2665948c2be0efe-643feb7bae71ea3-bbacb2e73e27333-423925d84eb5dfc-eeacb8665444333-eda4208baed9f20-2041351657b19c6-e45f83ee7ffb9cb-bdd688222433733-bb8cc8ed9eb8ea8-bc5ee8fb4e77a45-aa4eb3f53c13098-303404614b44e74-697101ba0cb8d35-abaccbeecedbeca-edb123f35eb4edb-a56ba9ccaedaeeb-674784bd6eed644-bdbcdbddbedbfdb-aecdebfcbfaaf89-444ffddb6533233-f342221771bbffc-c13e72cc0ffb19a-223087bd9feac43-acbddce75c44545-ddc2ac589667534-534a24d63bc4de4-eeeddc9cb433c63-feccdb976da4fc3-213e24eebbdc8ba-bca8baa87f87ea9-312545898bdaefb-632c85bcadebffc-201600a00b20e40-000912a12233ccc-333feefddfcde36-ddbcdb9cc6bb222-eeeeee333900b00-2369cdeef38ce65-9dafdafc6fa4e54-bb9655feb6aaacb-69adcbfb7f77a57-923eedddaaa6553-8ca986faafdafea-3322564aa9cadee-444000cf0f04401-eecadb6a9288656-fecffdcee9dc876-cfdbdb556a56f24-9caffce61f93996-5358788b9cf8d54-aaac57e15444333-fecd88444999ccc-0683993ba9a2eb1-e885449cbceceec-a06e14f64ed6399-f04f80fb28b00b7-febf84e42312fdb-5543339b628a357-1aa543ffefedaba-533d66fb8fcbedc-ffbaea6ba578525-eeecb8b25432110-977ca9997788576-ffeefdccbdebffd-7ceaddddce83f60-f46f99fcbcca8a9-ec7d54b24522577-3330660890bc0df-444767b88eb9fdb-f55f93fc2ed7dec-9b9fcaf87e46233-6548baefbea2b52-0ac4bcfeead38b0-5675cbce6f66c55-753d87ecaedccdd-edccb8066034013-414b15e70fc0891-5555784aa9dadfb-09a644c34e64ec5-e57d88ca9cddeed-4ba7caddaf99f47-9dcbdaddafa6643-322433355266188-af0fa0f0aa0f0af-c34d65fb78ac657-fd8eedfcafb7f99-7caddbdb6b53334-854dfeffdfddeaa-eee766888666100";


//-----------------------------------------------------------------------------
// main
//-----------------------------------------------------------------------------

const hashToTraits = hash => {

  // setup random fns
  const [r, rn, ri] = mkRandom(hash);

  // size / dimension consts
  const canvasWidth   = window.innerHeight;
  const canvasHeight  = window.innerHeight;
  const pStartX       = canvasWidth * 0.25;     
  const pEndX         = canvasWidth * 0.75;      
  const pStartY       = canvasHeight * 0.25;    
  const pEndY         = canvasHeight * 0.75;

  // random consts
  let rdPal = getPallet(pallettes.split("-"), r);                                                      // pick a random color pallette
  const rotCh = ri(1, 10) >= 9 ? true : false;                                              // 2 in 10 chance to randomly rotate the canvas 
  const divNum = ri(2, 10);                                                                 // we can have between 2 - 10 color divisions
  const chBGc = ri(1,10);                                                           // 2 in 10 chance of non-harmonious 'chaos' (any color!) background              
  const bgCl = chBGc < 9                                                            
    ? changeCC(selectRandom(rdPal, r), rn(0.45, 0.75))                                      // define the bg color as either a dulled/lightened color in the pallette,
    : color(ri(0, 255), ri(0, 255), ri(0, 255));                                            // or a 'chaos' color
  const slantChance = ri(1,10);
  let slantAdd = 0;                                                                         // default 'slant' angle is endY pos of portal - startY pos of portal / 4,
  const ySlantTweak = (pEndY - pStartY) / 4;                                                
  if(slantChance > 5) {                                                                     // there's a 50% chance this will get applied
    slantAdd = ySlantTweak;
  }
  const stWt = parseInt(ri(2,3));                                                      // the line weight of each strand can be between 2 (stringy) - 3 (solid)
  const curveCh = parseInt(ri(1, 10)) >= 9 ? true : false;                                  // 2 in 10 chance of sweeping bezier curves for some divisions
  const rndDy = randomDate(new Date(2012, 0, 1), new Date(), rn(0,1));                  // on a random day/month of the year, the script will slide-animate for the entire day.
  const divs = createDvs(rdPal, (pEndY - pStartY), pStartX, pEndX, divNum, ri, rn, r);      // divisions config const

  // adding to tokenState, to help in draw function in art.js
  tokenState.bgCl = bgCl;
  tokenState.rndDy = rndDy;
  tokenState.rotCh = rotCh;

  return {
    rdPal,
    divNum,
    chBGc,
    bgCl,
    slantAdd,
    ySlantTweak,
    stWt,
    curveCh,
    rndDy,
    divs,
    canvasWidth,
    canvasHeight,
    pStartX,
    pEndX,
    pStartY,
    pEndY
  };

};

