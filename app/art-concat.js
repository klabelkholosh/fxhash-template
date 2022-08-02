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


// Bitcoin Base58 encoder/decoder algorithm
const btcTable = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
console.assert(btcTable.length === 58);

// Base58 decoder/encoder for BigInt
function b58ToBi(chars, table = btcTable) {
  const carry = BigInt(table.length);
  let total = 0n, base = 1n;
  for (let i = chars.length - 1; i >= 0; i--) {
    const n = table.indexOf(chars[i]);
    if (n < 0) throw TypeError(`invalid letter contained: '${chars[i]}'`);
    total += base * BigInt(n);
    base *= carry;
  }
  return total;
}

//-----------------------------------------------------------------------------

const mkRandom = hash => {
  const s  = Array(4).fill()
    .map((_,i) => i * 12.75 + 2)
    .map(idx =>  b58ToBi(hash.slice(idx, idx + 12.75), btcTable));
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

    let xP = xpPal(c);
  
    let rgb = parseInt(xP, 16);                 // convert rrggbb to decimal
    let r = ((rgb >> 16) & 0xff) * prc;             // extract red and change prc
    let g = ((rgb >>  8) & 0xff) * prc;             // extract green
    let b = ((rgb >>  0) & 0xff) * prc;             // extract blue
    //return color(r,g,b);
    return [r,g,b];
  } else {
    return c;
  } 
}

//-----------------------------------------------------------------------------

// expand palette from 3-char colours to 6-char colours
const xpPal = p => p.split("").map((it)=>it + it).join("");

//-----------------------------------------------------------------------------

const toHex = x => x.toString(16).padStart(2, '0');

//-----------------------------------------------------------------------------

// grab BG colour
function getBG(rdPal, r1, rn, ri, chBGc) {
  let bgCl = 0;
  if (chBGc < 10) {
    bgCl = changeCC(selectRandom(rdPal, r1), rn(0.45, 0.75))
  } else {
    // bgCl = color(ri(0, 255), ri(0, 255), ri(0, 255));
    bgCl = [ri(0, 255), ri(0, 255), ri(0, 255)];
  }

  // check for not too similar to anything else in palette, otherwise crank up the brightness
  rdPal.map(p => {
    let 
      cPd = parseInt(xpPal(p), 16),
      l1 = bgCl[0],
      l2 = bgCl[1],
      l3 = bgCl[2];                           // convert rrggbb to decimal
    let rmean = ( ((cPd >> 16) & 0xff) + l1 ) / 2;
    let r = ((cPd >> 16) & 0xff) - l1;               // extract red and change prc
    let g = ((cPd >>  8) & 0xff) - l2;               // extract green
    let b = ((cPd >>  0) & 0xff) - l3;               // extract blue
    if (sqrt((((512+rmean)*r*r)>>8) + 4*g*g + (((767-rmean)*b*b)>>8)) < 15) { // 15 seems to be a good level of similarity.. below, too similar
      if (l1 === 0) { l1 = 255; l2 = 255; l3 = 255; } // extremely rare chance with ixchel with black bg & black other to not blend, therefore set to grey
      bgCl = changeCC([toHex(l1),toHex(l2),toHex(l3)].join(""), 0.5);
    }
  });
  return bgCl;
}

//-----------------------------------------------------------------------------

// on setup, get a random date (deterministic from seed)
function randomDate(start, end, rn) {
  return new Date(start.getTime() + rn * (end.getTime() - start.getTime()));
}


//-----------------------------------------------------------------------------
// fill square area with noise
// also, if you want to fill a shape area with noise, you can do so with a custom function.. 
// to do so, use doShape (make it true), shapeFunc (use a custom shape function, with x,y of square point catered for whether it falls in shape defined
// by function) and shapeVars for extra vars passed to function
// 
function doCutNoiseShape(stX, stY, wd, ht, xincr, yincr, clr, clrStrtLvl, clrEndLvl, randStrWt = false, doShape = false, shapeFunc = null, shapeVars = null, buf, winW, winH) {
    
  let x_off, y_off;

  for(let y=stY;y<ht;y=y+yincr){
      x_off += xincr;
      y_off = 0;
      for(let x=stX; x<wd; x=x+xincr) {

        if(!doShape || ((doShape) && shapeFunc(x,y,...shapeVars))) {
            buf.beginShape()
            buf.vertex(x,y);

            lerpCol = lerpedColorToWhite(clr, x, y, wd, clrStrtLvl, clrEndLvl, stX, stY, ht, winW, winH)
            // lerpCol = lerpColor(noiseCol, whiteCol, (map(x+y,stX+stY,wd+ht,0,1) * noiseV*clrEndLvl));
            if(randStrWt) { buf.strokeWeight(random(0.5, 2));}
            buf.stroke(lerpCol);

            buf.vertex(x+0.1,y);
            buf.endShape();

            y_off += yincr;
          }
      }
  }
}

//-----------------------------------------------------------------------------
// returns colour of a point (x,y) lerped within a given grid (stX, stY) from color level 1 -> 2, also averaged against x,y in whole window grid (windowHeigh, windowWidth)
// x, y = coords of point being drawn that needs color changed
// wd, ht = local width/height boundary coords of lerped area (that is, right-hand most width x coord and bottom-most y height coord)
// stX, stY = 0,0 of lerped area
// clrStttLvl = factor of given color to start with
// clrEndLvl = factor of given color to end up with
function lerpedColorToWhite(clr, x, y, wd, clrSttLvl, clrEndLvl, stX, stY, ht, winW, winH) {

  let noiseV = noise(x*y,  y-80/(1+pow(x-(wd * noise(x/302,y/50)),4)/16e6)*noise(x/30/50+y));
  let noiseCol = color(clr.levels[0]*clrSttLvl, clr.levels[1]*clrSttLvl, clr.levels[2]*clrSttLvl);
  let whiteCol = color(clr.levels[0]*clrEndLvl, clr.levels[1]*clrEndLvl, clr.levels[2]*clrEndLvl);
  // lerpCol = lerpColor(noiseCol, whiteCol, ((map(x+y,stX+stY,wd+ht,0,1) + map(x+y,stX+stY,windowHeight+windowWidth,0,1))/2) * noiseV*clrEndLvl);
  lerpCol = lerpColor(noiseCol, whiteCol, ((map(x+y,stX+stY,wd+ht,0,1) + map(x+y,0,winH+winW,0,1))/2) * noiseV * clrEndLvl);
  return(lerpCol);

}

//-----------------------------------------------------------------------------

// draw a textured triangle
function drawTxtrTri(x1, y1, x2, y2, x3, y3, clr, buf, winW, winH) {

  let smX = Math.min(x1,x2,x3);
  let lgX = Math.max(x1,x2,x3);
  let smY = Math.min(y1,y2,y3);
  let lgY = Math.max(y1,y2,y3);

  // do cut noise, within the triangle bounds
  doCutNoiseShape(smX, smY, lgX, lgY, ((lgX/smX)+(windowWidth/windowHeight))/3, ((lgY/smY)+(windowWidth/windowHeight))/3, clr, 0.7, 1.5, true, true, trianCollision, [x1, y1, x2, y2, x3, y3], buf, winW, winH);

}

//-----------------------------------------------------------------------------
// calculate if point (px, py) is within area of 3 triangle points (x1,y1 & x2,y2, & x3,y3)
function trianCollision(px, py, x1, y1, x2, y2, x3, y3) {
  // get the area of the triangle
  var areaOrig = floor(abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1)));

  // get the area of 3 triangles made between the point and the corners of the triangle
  var area1 = floor(abs((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)));
  var area2 = floor(abs((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py)));
  var area3 = floor(abs((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py)));
  //console.log("areaSum: " + (area1 + area2 + area3));

  // if the sum of the three areas equals the original, we're inside the triangle
  if (area1 + area2 + area3 <= areaOrig) {
    return true;
  }
  return false;
}

//-----------------------------------------------------------------------------

function setLineDash(list, buf) {
  buf.drawingContext.setLineDash(list);
}

//-----------------------------------------------------------------------------
function drawTxtrCirc(x, y, radX, radY, gaus, clr, buff, winW, winH) {

  //doCutNoise(x-radX, y-radY, x+radX, y+radY, 1, 1, clr, 0.7, 1.7, true, true, circCollision, [x, y, radX/2]);
  
  buff.push();
  buff.translate(x,y)
  for(let l=0; l<300; l++){
    let theta = random(0, TWO_PI);
    let h = randomGaussian(gaus);
    let r = (exp(h) - 1) / (exp(h) + 1);
    let xV = radX/2 * r * cos(theta);
    let yV = radY/2 * r * sin(theta);
    if(clr) {
      let pClr = lerpedColorToWhite(clr, x+xV, y+yV, x+(radX/2), 0.7, 1.7, x-(radX/2), y-(radY/2), y+(radY/2), winW, winH)
      buff.stroke(pClr);
    }
    buff.point(xV, yV, 10);
  }
  buff.pop();
  
}

//-----------------------------------------------------------------------------


// define the division data that will be used to generate the loom
function createDvs(rdPal, lineLayers, stX, enX, divNum, ri, rn, r) {
  let dvs = [];
  let cutY = parseInt(lineLayers / divNum);
  let pi = 0;
  let ctXRC = 0;

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
      cutX = r(1);
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

// if page is resized, especially height wise, ensure divisions are appropriately recalculated
function recalcDvs(divs, lineLayers, divNum) {
  let cutY = parseInt(lineLayers / divNum);
  for(let i = 0; i < divNum; i++) {
    divs[i].cutY = i === (divNum-1) ? lineLayers : cutY * (i+1);
  }
  return divs;
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
  const cvW = 1200;
  const cvH = 800;

  const pNum = parseInt(selectRandomDist(palletDist, r));                                   // pick a random color pallette
  const rdPal = getPallet(pNum, r);
  const chBGc = parseInt(selectRandomDist(divDist, r));                                     // 11% chance of non-harmonious 'chaos' (any color!) background              
  const bgCl = getBG(rdPal, r, rn, ri, chBGc, 0);                                           // define the bg color as either a dulled/lightened color in the pallette, or a 'chaos' color

  return {
    rdPal,
    bgCl,
    cvW,
    cvH,
    ri,
    rn
  };

};


class Circle {

    constructor(x, y, r, clr, buf) {
        this.x = x;
        this.y = y;  
        this.r = r;
        // this.neighbour = neighbour;
        this.growing = true;
        this.fillC = clr;
        this.fillCRand = color(`#${xpPal(random(tokenData.rdPal))}`);
        this.spacer =  tokenData.ri(1,2);
        this.rBzLinA =  tokenData.ri(1,5);
        this.rBzLinB =  tokenData.ri(1,5);
        this.rBzLinC =  tokenData.ri(1,5);
        this.rBzLinWd = tokenData.rn(0, 1);
        this.rBzAlpha =  tokenData.ri(100,255);
        this.shape = round(tokenData.ri(1,3),0); // 1 = solid tri, 2 = lined tri, 3 = square
        this.closestCircArr = [];
        this.buffer = buf;
        this.cubeR = color(`#${xpPal(random(tokenData.rdPal))}`);
        this.cubeG = color(`#${xpPal(random(tokenData.rdPal))}`);
        this.cubeB = color(`#${xpPal(random(tokenData.rdPal))}`);
        this.shapeDrawn = false;
        this.mvmentDrawn = false;
        this.layeredCubes = tokenData.rn(0, 1) > 0.5 ? 1 : 10;
        this.lineNums = tokenData.ri(3,20);
        this.numCircs = tokenData.ri(1,5);
        this.triOnTop = tokenData.rn(0, 1) > 0.5 ? true : false;
        this.divXBy = tokenData.rn(0, 1) > 0.5 ? 1 : 2;
        this.divYBy = this.divXBy === 1 ? 2 : 1;
        this.txtCircGaussBound = tokenData.ri(5,10);
        this.cubeStyle = [];
        for(let lc = 1; lc<=this.layeredCubes; lc++) {
            this.cubeStyle.push(tokenData.rn(0, 1) > 0.5 ? 'spiral' : 'lines');
        }
    }

    show() {
        // console.log('this.fillC: ', this.fillC);
        this.fillC.setAlpha(this.rBzAlpha);
        this.buffer.stroke(this.fillC);

        if(this.rBzLinWd > 0.5) { this.buffer.noFill(); }
        this.buffer.strokeWeight(this.rBzLinWd*2);
        
        for(let p=0; p<this.closestCircArr.length; p++) {
            let el = this.closestCircArr[p];
            drawingContext.setLineDash([0, 0]);
            for(let l=-5; l<10; l=l+2.5) {
                this.buffer.bezier(
                    (this.x * tokenData.scaleW) + l + tokenData.ri(1,10), (this.y * tokenData.scaleH) + l + tokenData.ri(1,10), 
                    (this.x * tokenData.scaleW) + (this.r * ((tokenData.scaleW + tokenData.scaleH)/2)) + l, (this.y * tokenData.scaleH) - (this.r * ((tokenData.scaleW + tokenData.scaleH)/2)) + l, 
                    (el.x * tokenData.scaleW) - (this.r * ((tokenData.scaleW + tokenData.scaleH)/2)) + l + tokenData.ri(1,10), (el.y * tokenData.scaleH) + (this.r * ((tokenData.scaleW + tokenData.scaleH)/2)) + l,
                    (el.x * tokenData.scaleW) + l , (el.y * tokenData.scaleH) + l
                );
            }
        };
    }

    recalcNeighbour(circles) {
        // figure out closest circle in array and send to circle object
        let closestCirc;

        if(circles.length>0) {
            
            closestCirc = circles.filter(c => c.x !== this.x && c.y !== this.y).reduce((a,b) => {                     
                return dist(this.x, this.y, a.x, a.y) <= dist(this.x, this.y, b.x, b.y) ? a : b;
            });
            if(!this.closestCircArr.filter(c => c === closestCirc).length){ // don't add if it already exists...
                this.closestCircArr.push(closestCirc);
            }
            
        } 
    }

    grow() {
        if (this.growing) {
            this.r = this.r + 2;
        } else {
            this.r = this.r - 2;
            if (this.r <= 0) { this.growing = true; }
        }
    }

    edges(winW, winH) {
        return(this.x+this.r > winW || this.x-this.r < 0 || this.y+this.r > winH || this.y-this.r < 0);
    }

    drawCube(xx, yy, c, r, z, buffer, cubeStyle) {

        let x = xx + (c - r) * 50 * sqrt(3) / 2;
        let y = yy + (c + r) * 50 / 2 - (50 * z);
        let loopMax = 20;
        let incr = 2;
        let points = [];
        let smallCube = tokenData.rn(0.75,3); // normally 1
        
        for (let angle = PI / 6; angle < PI * 2; angle += PI / 3) {
            points.push(
                buffer.createVector(x + cos(angle) * (50/smallCube),
                y + sin(angle) * (50/smallCube)));
        }
        
        buffer.noFill();
        buffer.strokeWeight(tokenData.ri(1,2));
        
        // scale our more re-used coords correctly, for drawing things
        let scX = (x * tokenData.scaleW);
        let scY = (y * tokenData.scaleH);
        let scP0y = (points[0].y * tokenData.scaleH);
        let scP2y = (points[2].y * tokenData.scaleH);
        let scP3x = (points[3].x * tokenData.scaleW);
        let scP3y = (points[3].y * tokenData.scaleH);
        let scP4x = (points[4].x * tokenData.scaleW);
        let scP4y = (points[4].y * tokenData.scaleH);
        let scP5x = (points[5].x * tokenData.scaleW);
        let scP5y = (points[5].y * tokenData.scaleH);

        // line style
        if(cubeStyle === 'lines') {
           
            let topBzFact = (tokenData.ri(1,3)*(this.lineNums/smallCube));
            let yDist1;
            let yDist2;
            let xDist1 = (x - points[3].x) / this.lineNums;
            let xDist2 = (points[5].x - points[4].x) / this.lineNums;
            for(let l=1; l<=this.lineNums; l++) {

                buffer.stroke(this.cubeR);
                yDist1 = (points[1].y - y) / this.lineNums;
                yDist2 = (points[0].y - points[5].y) / this.lineNums;
                // right face normal 3 lines
                buffer.bezier(
                    scX , scY + ((yDist1 * tokenData.scaleH) * l) ,
                    scX , scY + ((yDist1 * tokenData.scaleH) * l) ,
                    scP5x , scP5y + ((yDist2 * tokenData.scaleH) * l) ,
                    scP5x , scP5y + ((yDist2 * tokenData.scaleH) * l)
                )

                buffer.stroke(this.cubeG);
                // left edge normal 3 lines
                buffer.bezier(
                    scX , scY + ((yDist1 * tokenData.scaleH) * l) ,
                    scX , scY + ((yDist1 * tokenData.scaleH) * l) ,
                    scP3x, scP3y + ((yDist2 * tokenData.scaleH) * l) ,
                    scP3x, scP3y + ((yDist2 * tokenData.scaleH) * l) 
                )

                buffer.stroke(this.cubeB);
                yDist1 = (y - points[3].y) / this.lineNums;
                yDist2 = (points[5].y - points[4].y) / this.lineNums;
                // top face normal 3 lines
                buffer.bezier(
                    scP3x + ((xDist1 * tokenData.scaleW) * l) , scP3y + ((yDist1 * tokenData.scaleH) * l),
                    scP3x + ((xDist1 * tokenData.scaleW) * l) , scP3y + ((yDist1 * tokenData.scaleH) * l) - (topBzFact * tokenData.scaleH),
                    scP4x + ((xDist2 * tokenData.scaleW) * l) , scP4y + ((yDist2 * tokenData.scaleH) * l) - (topBzFact * tokenData.scaleH),
                    scP4x + ((xDist2 * tokenData.scaleW) * l) , scP4y + ((yDist2 * tokenData.scaleH) * l) - (topBzFact * tokenData.scaleH)
                )
            }
            
        // spiral style
        } else {

            loopMax = loopMax / smallCube;

            // right face
            buffer.stroke(this.cubeR);
            buffer.beginShape();
            for(let l=0; l<loopMax; l += incr) {
                buffer.vertex(scX+l, scY+l);
                buffer.vertex(scP5x-l, scP5y+(l*((2.25 * tokenData.scaleH)/smallCube)));
                buffer.vertex(scP5x-l, scP0y-l);
                if(l<loopMax){ buffer.vertex(scX+(l+incr), (scY+(scP0y - scP5y))-(l*((2.25 * tokenData.scaleH)/smallCube))); }
            }
            buffer.endShape();
    
    
            // left face
            buffer.stroke(this.cubeG);
            buffer.beginShape();
            for(let l=0; l<loopMax; l += incr) {
                buffer.vertex(scX-l, scY+l);
                buffer.vertex(scP3x+l, scP3y+(l*((2.25 * tokenData.scaleH)/smallCube)));
                buffer.vertex(scP3x+l, scP2y-l);
                if(l<loopMax){ buffer.vertex(scX-(l+incr), (scY+(scP2y - scP3y))-(l*((2.25 * tokenData.scaleH)/smallCube))); }
            }
            buffer.endShape();

            // top face
            buffer.stroke(this.cubeB);
            buffer.beginShape();
            for(let l=0; l<loopMax; l += incr) {
                buffer.vertex(scX, scY-(l*((1.25 * tokenData.scaleH)/smallCube)));
                buffer.vertex(scP5x-(l*((2.5 * tokenData.scaleW)/smallCube)), scP5y);
                buffer.vertex(scX, scP4y+(l*((1.25 * tokenData.scaleH)/smallCube)));
                buffer.vertex(scP3x+(l*((2.5 * tokenData.scaleW)/smallCube))+(incr), scP5y-(incr));
                // buffer.vertex(points[3].x+((l*(incr))/(loopMax*0.25)), points[3].y-(incr/2));
                //if(l<loopMax*1.25){ buffer.vertex(points[3].x+(l*1.75), points[3].y); }
            }
            buffer.endShape();
        }
     
        
        
    }

    // those grainy circle lines that run across triangles and other areas
    drawMovementLines(buffer, winW, winH) {

        if(this.mvmentDrawn === false) {

            if(this.closestCircArr.length > 3) {
                let c = this.closestCircArr;
                let cntrTriX = (c[0].x + c[1].x + c[2].x)/3;
                let cntrTriY = (c[0].y + c[1].y + c[2].y)/3;

                // movement line
                let lineClr = color(`#${xpPal(random(tokenData.rdPal))}`);
                lineClr = this.fillCRand;
                lineClr.setAlpha(255);

                // do circles (or weird shape) along line from center of triangle to a point
                for(let cc=0; cc<this.numCircs; cc++) {
                    // buffer.point(lerpX1, lerpY1, dist(c[0].x, c[0].y, cntrTriX, cntrTriY)/this.numCircs);
                    buffer.fill(lineClr);
                    for(let cd=0; cd<c.length; cd++) {
                        drawTxtrCirc(
                            (lerp(cntrTriX, c[cd].x, map(cc, 0, this.numCircs, 0, 1)) * tokenData.scaleW), 
                            (lerp(cntrTriY, c[cd].y, map(cc, 0, this.numCircs, 0, 1)) * tokenData.scaleH), 
                            ((dist(c[cd].x, c[cd].y, cntrTriX, cntrTriY)/this.numCircs)/this.divXBy * tokenData.scaleH),
                            ((dist(c[cd].x, c[cd].y, cntrTriX, cntrTriY)/this.numCircs)/this.divYBy * tokenData.scaleH), 
                            tokenData.rn(0.5, this.txtCircGaussBound), 
                            lineClr, 
                            buffer,
                            winW,
                            winH
                        );
                    }
                }
            }
            this.mvmentDrawn = true;
        }
    }

    drawTriangles(buffer, winW, winH) {
        if(this.shapeDrawn === false) {
       
            if(this.closestCircArr.length > 3) {
                
                let c = this.closestCircArr;

                // solid triangle
                if(this.shape === 1) {
                    
                    buffer.noStroke();

                    // shadow triangle
                    let dullClr = lerpColor(this.fillC, color('black'), 0.5)
                    dullClr.setAlpha(100);
                    buffer.fill(dullClr);
                    buffer.triangle(
                        (c[0].x * tokenData.scaleW),
                        (c[0].y * tokenData.scaleH),
                        (c[1].x * tokenData.scaleW) + (10 * tokenData.scaleW),
                        (c[1].y * tokenData.scaleH) + (10 * tokenData.scaleH),
                        (c[2].x * tokenData.scaleW) + (10 * tokenData.scaleW),
                        (c[2].y * tokenData.scaleH) + (10 * tokenData.scaleH),
                    );
                    
                    // main triangle
                    let testClr = this.fillC;
                    buffer.fill(testClr);
                    
                    drawTxtrTri(
                        (c[0].x * tokenData.scaleW),
                        (c[0].y * tokenData.scaleH),
                        (c[1].x * tokenData.scaleW),
                        (c[1].y * tokenData.scaleH),
                        (c[2].x * tokenData.scaleW),
                        (c[2].y * tokenData.scaleH)
                        ,testClr
                        ,buffer
                        ,winW
                        ,winH
                    );
                    
                    // draw random lines across triangle surface
                    for(let tr=0; tr<20; tr++) {
                        let tClr = color(`#${xpPal(random(tokenData.rdPal))}`);
                        tClr.setAlpha(100);
                        buffer.stroke(tClr);
                        buffer.strokeWeight(tokenData.rn(0.1,0.5));
                        setLineDash([tokenData.ri(1,10), tokenData.ri(1,10)], buffer);
                        let randLerp1 = tokenData.rn(0, 1);
                        let randLerp2 = tokenData.rn(0, 1);
                        let lerpX1 = lerp(c[0].x, c[1].x, randLerp1);
                        let lerpY1 = lerp(c[0].y, c[1].y, randLerp1);
                        let lerpX2 = lerp(c[1].x, c[2].x, randLerp2);
                        let lerpY2 = lerp(c[1].y, c[2].y, randLerp2);
                        buffer.line(
                            (lerpX1 * tokenData.scaleW), 
                            (lerpY1 * tokenData.scaleH), 
                            (lerpX2 * tokenData.scaleW), 
                            (lerpY2 * tokenData.scaleH)
                        );
                    }
                    setLineDash([], buffer);
                    
                    
                // lined triangle
                } else if(this.shape === 2) {
                    // fill triangle shape with lines across two of the sides..
                    let lineNums = tokenData.ri(100, 300); // how many lines will we be drawing?

                    // figure out distance and scale to lines needed inside triangle
                    let xdist1 = (c[1].x - c[0].x) / lineNums; // x distance between first and second point
                    let xdist2 = (c[2].x - c[0].x) / lineNums; // x distance between first and third point
                    let ydist1 = (c[1].y - c[0].y) / lineNums; // y distance between first and second point
                    let ydist2 = (c[2].y - c[0].y) / lineNums; // y distance between first and third point

                    // for as many lines as we need, fill with lines or squares...
                     // line shadow
                    for(let l=1; l<=lineNums; l++){
                        buffer.strokeWeight(tokenData.rn(0.1,this.r/5));
                        let dullClr = lerpColor(this.fillC, color('black'), 0.5)
                        dullClr.setAlpha(100);
                        buffer.stroke(dullClr);
                        buffer.line(
                            (c[0].x * tokenData.scaleW) + ((xdist1 * tokenData.scaleW) *l) + tokenData.ri(1,5) + (5 * tokenData.scaleW),
                            (c[0].y * tokenData.scaleH) + ((ydist1 * tokenData.scaleH) *l) + tokenData.ri(1,5) + (10 * tokenData.scaleH),
                            (c[0].x * tokenData.scaleW) + ((xdist2 * tokenData.scaleW) *l) + tokenData.ri(1,5) + (5 * tokenData.scaleW),
                            (c[0].y * tokenData.scaleH) + ((ydist2 * tokenData.scaleH) *l) + tokenData.ri(1,5) + (10 * tokenData.scaleH),
                        );
                    }
                    // actual line
                    for(let l=1; l<=lineNums; l++){

                        let inter = map(l, 1, lineNums, 0, 1);
                        let lerC = lerpColor(this.fillC, this.fillCRand, inter);

                        lerC.setAlpha(255);
                        buffer.strokeWeight(tokenData.ri(1,2));
                        buffer.stroke(lerC);
                        buffer.line(
                            (c[0].x * tokenData.scaleW) + ((xdist1 * tokenData.scaleW) *l) + tokenData.ri(1,5),
                            (c[0].y * tokenData.scaleH) + ((ydist1 * tokenData.scaleH) *l) + tokenData.ri(1,5),
                            (c[0].x * tokenData.scaleW) + ((xdist2 * tokenData.scaleW) *l) + tokenData.ri(1,5),
                            (c[0].y * tokenData.scaleH) + ((ydist2 * tokenData.scaleH) *l) + tokenData.ri(1,5),
                        );
                    }
                    
                // draw a 'cube'-type shape (or layered cube)
                } else if(this.shape === 3) {

                    for(let l=1; l<= this.layeredCubes; l++){
                        buffer.strokeWeight(tokenData.rn(0, 1)); // thin between 0.1 and 1
                        this.drawCube(
                            c[0].x, c[0].y,
                            1, 1, 1, buffer, this.cubeStyle[l]
                        );
                    }
                    
                }
                this.shapeDrawn = true;
            }
        }
    }
}
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

let circles = [];
let fxPrevOccurred = false;

function setup() {

    // grab hash from tokenData
    //hash = tokenData.hash;
    hash = fxhash; //FXHash!!
    // hash = "oowapvYE5Yfx4mrdDfivsE8ynnMnfBBJPUbGCiAUyLaeqdr2LrE";
    console.log('hash:', hash);
    randomSeed(hash);
    noiseSeed(hash);

    let {
        seed,
        rdPal,
        cvW,
        cvH,
        bgCl,
        ri,
        rn
    } = hashToTraits(hash);
    
    console.log('rdPal:', rdPal);

    tokenState.runScript = true;
    tokenData.ri = ri;
    tokenData.rn = rn;
    tokenData.bgCl = bgCl;
    tokenData.rdPal = rdPal;
    tokenData.cvW = cvW;
    tokenData.cvH = cvH;

    const ar_origin = tokenData.cvW / tokenData.cvH;
    const ar_new = windowWidth / windowHeight;
    let scale_w = windowWidth / tokenData.cvW;
    let scale_h = windowHeight / tokenData.cvH;
    if (ar_new > ar_origin) {
        scale_w = scale_h;
    } else {
        scale_h = scale_w;
    }
    tokenData.scaleW = scale_w;
    tokenData.scaleH = scale_h;

    createCanvas(tokenData.cvW * tokenData.scaleW, tokenData.cvH * tokenData.scaleH);
    bgBuf = createGraphics(tokenData.cvW * tokenData.scaleW, tokenData.cvH * tokenData.scaleH);
    mainBuf = createGraphics(tokenData.cvW * tokenData.scaleW, tokenData.cvH * tokenData.scaleH);
    onTopBuf = createGraphics(tokenData.cvW * tokenData.scaleW, tokenData.cvH * tokenData.scaleH);

    bgBuf.background(tokenData.bgCl);
    doCutNoise(0,0, tokenData.cvW * tokenData.scaleW, tokenData.cvH * tokenData.scaleH, 1.1,5.1, color(tokenData.bgCl), 0.1, 2, bgBuf);

    //define points we can draw in!
    let tempDP = [];
    for(let x=(tokenData.cvW)*0.1; x<(tokenData.cvW)*0.9; x++) {
        for(let y=(tokenData.cvH)*0.1; y<(tokenData.cvH)*0.9; y++) {
            tempDP.push([x,y]);
        }
    }
    tokenData.drawPoints = tempDP;
    // mainBuf.rectMode(CENTER);

}

function keyPressed() {
    // if SPACE or 'S' is pressed...
    if (keyCode === 32 || keyCode === 83) {
      tokenState.runScript = !tokenState.runScript;
    }
  }

function draw() { 

    if(tokenState.runScript) {
        image(bgBuf, 0, 0);
        mainBuf.clear();
        
        let total = 3;                                     // so instead of just drawing one circle every draw() loop, we can do <whatevs this number is> at a time!
        let count = 0;
        let attempts = 0;
    
        if(circles.length < 300) { // hard limit
            while (count < total) {
                c = newCircle();
                if(c !== null) {
                    circles.push(c);
                    count++;
                }
                attempts++;
                if(attempts > 8) {                            // basically if we can't do more than this attempt in our shotgun total var blast, call it a day for draw()ing :)
                    // noLoop();
                    // console.log('DONE!', circles.length);
                    break;
                    
                }
            }
        } else {
            //noLoop();
            // we're DONE OVERS, so do the static layer...
            circles.map(c => {
                if(c.triOnTop === true) {
                    c.drawMovementLines(onTopBuf, (tokenData.cvW), (tokenData.cvH));
                    c.drawTriangles(onTopBuf, (tokenData.cvW), (tokenData.cvH));
                } else {
                    c.drawTriangles(onTopBuf, (tokenData.cvW), (tokenData.cvH));
                    c.drawMovementLines(onTopBuf, (tokenData.cvW), (tokenData.cvH));
                }      
            });
            image(onTopBuf, 0, 0);
            if(!fxPrevOccurred) { 
                fxpreview();
                fxPrevOccurred = true;
            }
        }
        
    
        circles.map(c => {
            if(c.growing) {
                if(c.edges((tokenData.cvW), (tokenData.cvH))) {                                                             // if we're on an edge, stop growing!
                    c.growing = false; 
                } else {
                    for(let i=0; i<circles.length; i++) {                                   // check if we overlap with any other circle already defined
                        let othC = circles[i];
                        if(c != othC) {                                                     // don't check against yourself!
                            let d = dist(c.x, c.y, othC.x, othC.y);
                            if (d - 2.5 < (c.r+othC.r)) {                                   // if distance between centerpoints of both circles less than both circles radii plussed, we're overlapping obvs :)
                                c.growing = false;
                                break;
                            }
                        }
                    };
                }
            }
            c.recalcNeighbour(circles);
            c.show();
            c.grow();
            c.edges((tokenData.cvW), (tokenData.cvH));
        });
        image(mainBuf, 0, 0);
    }
   
}

function windowResized() {
    
    const ar_origin = tokenData.cvW / tokenData.cvH;
    const ar_new = windowWidth / windowHeight;
    let scale_w = windowWidth / tokenData.cvW;
    let scale_h = windowHeight / tokenData.cvH;
    if (ar_new > ar_origin) {
        scale_w = scale_h;
    } else {
        scale_h = scale_w;
    }
    tokenData.scaleW = scale_w;
    tokenData.scaleH = scale_h;
    resizeCanvas(tokenData.cvW * tokenData.scaleW, tokenData.cvH * tokenData.scaleH);
    onTopBuf.clear();
    circles.map(c => {
        c.mvmentDrawn = false;
        c.shapeDrawn = false;
        if(c.triOnTop === true) {
            c.drawMovementLines(onTopBuf, (tokenData.cvW), (tokenData.cvH));
            c.drawTriangles(onTopBuf, (tokenData.cvW), (tokenData.cvH));
        } else {
            c.drawTriangles(onTopBuf, (tokenData.cvW), (tokenData.cvH));
            c.drawMovementLines(onTopBuf, (tokenData.cvW), (tokenData.cvH));
        }      
    });
    image(onTopBuf, 0, 0);
    
    //location.reload();
}

function doCutNoise(stX, stY, wd, ht, xincr, yincr, clr, clrStrtLvl, clrEndLvl, gfxBuffer) {
    
    let x_off, y_off;
    for(let y=stY;y<ht;y=y+yincr){
        x_off += xincr;
        y_off = 0;
        for(let x=stX; x<wd; x=x+xincr) {
    

            let noiseV = 
            noise(
                x*y,  y-80/(1+pow(x-(wd * noise(x/302,y/50)),4)/16e6)*noise(x/30/50+y)
            );

            noiseCol = color(
                clr.levels[0]*clrStrtLvl,
                clr.levels[1]*clrStrtLvl,
                clr.levels[2]*clrStrtLvl
                );
            whiteCol = color(clr.levels[0]*clrEndLvl,
                clr.levels[1]*clrEndLvl,
                clr.levels[2]*clrEndLvl);

            lerpCol = lerpColor(noiseCol, whiteCol, ((map(x+y,stX+stY,wd+ht,0,1) + map(x+y,stX+stY,(tokenData.cvH * tokenData.scaleH)+(tokenData.cvW * tokenData.scaleW),0,1))/2) * noiseV*clrEndLvl);
            // lerpCol = lerpColor(noiseCol, whiteCol, (map(x+y,stX+stY,wd+ht,0,1) * noiseV*clrEndLvl));
            gfxBuffer.stroke(lerpCol);
            gfxBuffer.fill(lerpCol);
            gfxBuffer.point(x+0.1,y, 10);
 

            y_off += yincr;
        }
    }
    
}

function newCircle() {
    let si = int(tokenData.ri(0, tokenData.drawPoints.length));
    let spot = tokenData.drawPoints[si];
    let x = spot[0] ;
    let y = spot[1] ;
    let valid = true;

    for(let i=0; i<circles.length; i++) { 
        let c = circles[i];
        let d = dist(x, y, c.x, c.y);
        if (d<c.r) {                        // check we aren't creating a circle INSIDE one already defined!
            valid = false;
            break;
        }
    };

    if(valid){
        let tmpClr = xpPal(random(tokenData.rdPal));
        return new Circle(x,y,1.5, color(`#${tmpClr}`), mainBuf);
    } else {
        return null;
    }
}