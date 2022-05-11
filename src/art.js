//-----------------------------------------------------------------------------
// art.js - art generation
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

let outputScale = 5;
let currentScale;
let myScaledCanvas;
let canvas;

function setup() {

  // grab hash from tokenData
  hash = tokenData.hash;
  // hash = "0x86b21247f817078995b93e8b76ca71d38087f3ca38aa2ff847b233182636597a"; // us
  hash = "0x3a91e7d9c341211e48f54e050105848a71bd1632f9518d3bd1b98a93bc7f93ab"; // kim
  hash = "0x1a6d9e599f0fa532733c29056d292a6b10aede7cef0624c4405e376c1b8ef0c8"; // karen
  console.log('hash:', hash);

  let {
    seed,
    rdPal,
    slA,
    ySlT,
    stWt,
    cvCh,
    divs,
    cvW,
    cvH,
    stX,
    enX,
    stY,
    enY,
    rotCh,
    bgCl,
    rndDy,
    divNum,
    slCh
  } = hashToTraits(hash);

  // default frame-rate is 8
  frameRate(8);                                              
// pixelDensity(12);

  // create canvas
  canvas = createCanvas(cvW, cvH);

  // adding to tokenState, to initialize / help in draw function
  tokenState.bgCl = color(bgCl);
  tokenState.rndDy = rndDy;
  tokenState.rotCh = rotCh;
  tokenState.loom = [];
  tokenState.xSl = 0;
  tokenState.flatA = 0;
  tokenState.anmC = 0;
  tokenState.divNum = divNum;
  tokenState.slCh = slCh;
  tokenState.cvW = cvW;
  tokenState.cvH = cvH;

  // push defined loom to array
  tokenState.loom.push([
    0.1, 
    1, 
    stX, 
    enX, 
    stY, 
    enY, 
    divs,
    ySlT, 
    slA, 
    stWt,
    cvCh,
    rdPal
  ]);
  
  rot();

  // place an initial loom, just in case script starts off non-animated
  placeLoom();

}

//-----------------------------------------------------------------------------

/**
 * Draw is required to be defined for processing library to load into the
 *  global scope.
 */
function draw() {

  // convert 'true' from contract string
  const isTrueSet = (String(tokenState.moving).toLowerCase() === 'true');

  // only animate if moving is true
  if (isTrueSet) {
    
    rot();

    // draw the loom
    placeLoom();
    
    // if a particular day and month, slowly animate the script further for the entire day.
    if ((new Date().getDate() === tokenState.rndDy.getDate()) && (new Date().getMonth() === tokenState.rndDy.getMonth())) {
      let sgma = sin(tokenState.anmC / 8000) * 100
      tokenState.anmC = tokenState.anmC + 100;
      tokenState.xSl = sgma;
      tokenState.flatA = sgma;
    }
  }
  
}


// define our canvas bg and draw a loom.. pulled out of draw() function so that setup() can call this initially for non-animated states
function placeLoom() {
  background(tokenState.bgCl);                                           // set bg color
  tokenState.fltTwk = 10 + Number(tokenState.flutA);                     // default flutter tweak is 10, plus/minus user setting
  noFill();                                                              // no fills plz

  // if height/width was resized.. recalc the divisions, slants, etc. and append loom object for redrawing
  let
    wS = tokenState.cvW * 0.25,
    wE = tokenState.cvW * 0.75,
    hS = tokenState.cvH * 0.25,
    hE = tokenState.cvH * 0.75;

  tokenState.loom[0][2] = (wS) + ((wS) - (hS)) > 20 ? (wS) + ((wS) - (hS)) : 20;
  tokenState.loom[0][3] = (wE) - ((wS) - (hS));
  tokenState.loom[0][4] = hS;
  tokenState.loom[0][5] = hE;
  tokenState.loom[0][6] = recalcDvs(tokenState.loom[0][6], ((hE) - (hS)), tokenState.divNum);
  tokenState.loom[0][7] = (hE - hS) / 4;  
  if(tokenState.slCh > 5) { tokenState.loom[0][8] = (hE - hS) / 4; }

  drawLoom(...tokenState.loom[0]);                                       // draw the loom!
}

function windowResized(){
  resizeCanvas(tokenState.cvW, tokenState.cvH);
  if (!(String(tokenState.moving).toLowerCase() === 'true')) { rot(); }
  placeLoom();
}


 // rotate if we need to
function rot() {
  if(tokenState.rotCh) {
    rotate(-1.575);
    translate(-(tokenState.cvW/2) - (tokenState.cvH/2), (tokenState.cvW/2) - (tokenState.cvH/2));
  }
}

//-----------------------------------------------------------------------------------------------------------------------------------
// OUR MAIN FUNCTION THAT PULLS IT ALL TOGETHER AND DRAWS A DAMN LOOM
//-----------------------------------------------------------------------------------------------------------------------------------

function drawLoom(htP, htPIncr, xSt, xEn, ySt, yEn, dvs, ySlT, slA, stWt, cvCh, rdPal) {

  // let's draw our central interference object
  for (let i = 0; i < (yEn - ySt); i++) {

    // set a stroke weight
    strokeWeight(stWt + Number(tokenState.lnThk));

    // define slightly random widths / line height starting positions, to create flutter effect
    let fT = random(tokenState.fltTwk);
    let x1 = xSt + fT;
    let x2 = xEn - fT;
    let y1 = ySt + htP + fT / 2;
    let y2 = ySt + htP + fT / 2;

    // draw an interference line
    if (y1 < yEn) { // this 'if' is what cuts it off at the bottom. maybe needs work... TODO

      // grab a color from the found division
      stroke(dvs.find((el) => i < el.cutY).color);

      // if there's an X cut, draw both colored lines, otherwise just solid line
      if(chkXd(i, dvs)) {

        // draw either an angled cutX line, or a pouring/droopy one...
        ctXst = dvs.find((el) => i < el.cutY).ctXst;
        if(ctXst !== null) {
          ltXtw = (xEn - xSt) / 16;
          drawLine(x1, x2, y1, y2, 0, ySlT + tokenState.flatA, false, xSt, xEn, ySt, yEn, ctXst, i, dvs);
        } else {
          ltXtw = 0;
          drawCutXLine(dvs, x1, y1, y2, i, ySlT + tokenState.flatA, x2);
        }

        // get line slice point
        tL = (x1 + (dvs.find((el) => i < el.cutY).cutX * (xEn - x1))) + random(tokenState.fltTwk) + ltXtw + tokenState.xSl;
        tX2 =  tL > x2 ? x2 :  tL < x1 ? x1 : tL;  // ensure we're not going over the right-most X bound

        // draw shadow line for above
        if (ySlT + tokenState.flatA > 0) {
          drawLine(x1, tX2, y1, y2, 0, 0, cvCh, xSt, xEn, ySt, yEn, "1", null, null, rdPal);
        }

        // draw the rest of the divided line, using cutX's colour..
        stroke(dvs.find((el) => i < el.cutY).colorX);
        drawLine(tX2, x2, y1, y2, 0, 0, false);
          
      } else {
        drawLine(x1, x2, y1, y2, slA + tokenState.flatA, 0, cvCh, xSt, xEn, ySt, yEn, "0"); // uncut

        // shadow line, if we're slanted
        if (slA + tokenState.flatA > 0) {
          drawLine(x1, x2, y1, y2, 0, 0, false, xSt, xEn, ySt, yEn, "2", null, null, rdPal);
        }
      
      }
    
    }

    noStroke();

    // move on to the next line postiion
    htP = htP + htPIncr;
  }
}

//-----------------------------------------------------------------------------------------------------------------------------------
// DRAWING FUNCTIONS
//-----------------------------------------------------------------------------------------------------------------------------------

// when we want to draw line that doesn't have a vertical division.. basically a 'solid' line. can be flat, or 'lifted'. and can curve crazily.
function drawLine(x1, x2, y1, y2, slA, ySlT, cvCh, xSt, xEn, ySt, yEn, lS, ctr, dvs, rdPal) {

  let 
    cpx1,
    cpy1,
    cpx2,
    cpy2,
    crCtX = lS === "3" || lS === "4" ? (x1 + (dvs.find((el) => ctr < el.cutY).cutX * (x2 - x1))) : null,
    bz1 = x1  + ((xEn - xSt) / 4),
    bz3 = crCtX + random(tokenState.fltTwk),
    bz4 = y2 - ((yEn - ySt) / 20),
    tY1 = y1 - ySlT + random(tokenState.fltTwk / 2), 
    tX2 = x2,
    tY2 = slA > 0 ? y2 - slA + random(tokenState.fltTwk / 2) : y2;

    if (lS === "1" || lS === "2") { // shadow dark or shadow_light
      let dk = lS === "1" ? random(0.1, 0.4) : random(0.5, 0.75);
      stroke(color(changeCC(random(rdPal), dk)));
    } else if (lS === "3" || lS === "4") { // droopy or pouring
      // bezier curve points 
      cpx1 = bz1; 
      cpy1 = lS === "3" ? (y1 + random(tokenState.fltTwk / 2)) : (y1 - ySlT + random(tokenState.fltTwk / 2)) + ((yEn - ySt) / 20); 
      cpx2 = lS === "3" ? bz3 : (bz3) - ((xEn - xSt) / 40);  
      cpy2 = bz4;

      // ensure we don't go over the right-hand width
      tL = crCtX + random(tokenState.fltTwk) + ((xEn - xSt) / 20) + tokenState.xSl;
      tX2 =  tL > x2 ? x2 :  tL < x1 ? x1 : tL;
      tY2 = y2;
    }

    if (cvCh) {
      // bezier curve points
      cpx1 = (xSt + xEn) / 2;
      cpy1 = (y1 - ((yEn - ySt) / 4));
      cpx2 = (xSt + xEn) / 2;
      cpy2 = (y1 + ((yEn - ySt) / 4));
    } else {
      if (lS !== "3" && lS !== "4") {
        cpx1 = x1;
        cpy1 = y1;
        cpx2 = tX2;
        cpy2 = tY2;
        tY1 = y1;
      }
    }
    
    bezier(
      x1, 
      tY1,
      cpx1, 
      cpy1, 
      cpx2, 
      cpy2, 
      tX2, 
      tY2
    );
  
}

// when we want to draw one of the 'cutX' thread lines..
function drawCutXLine(dvs, x1, y1, y2, ctr, ySlT, xEn) {

  // find cut x percentage point, use right x - start x to get length, then times by percentage and add to first x point to get cut point
  tL = (x1 + (dvs.find((el) => ctr < el.cutY).cutX * (xEn - x1))) + tokenState.xSl + random(tokenState.fltTwk);
  tX2 =  tL > xEn ? xEn : tL < x1 ? x1 : tL; // ensure we don't go over the right-hand width, nor before 1st xpos point

  line(
    x1, 
    y1 - ySlT + random(tokenState.fltTwk / 2), 
    tX2, 
    y2
  );
}

//-----------------------------------------------------------------------------------------------------------------------------------
// DIVISION-SPECIFIC FUNCTIONS
//-----------------------------------------------------------------------------------------------------------------------------------

// check if there indeed is an X cut in a division
const chkXd = (i, dvs) => dvs.find((el) => i < el.cutY).cutX !== null ? true : false;
