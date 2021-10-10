//-----------------------------------------------------------------------------
// art.js - art generation
//-----------------------------------------------------------------------------

// TODO: 
// 1) move all global variables to tokenState in boot.js (things such as most static stuff in my setup() function, ie. canvas dimensions etc.?) 
//      yeah for 1) you can just attach your globals onto that object in setup
//      you don'ty need to add the in boot
//      tokenState global will always exist so you can piggy back on it
//       
//      - shouldn't need initialTokenState as that will always exist, for token without state we'll load the default from the contract,  this should come from the boot.js file
//      
// 2) move away from randomSeed (I had no idea it was limited to 16 bytes heh heh) and add as needed to traits.js, using xoshiro algo
//  if the random functions stuff is confusing let me know 
//  there are just different functions that do that same as the one big p5 random function does
//  like randomInt randomDecimal etc
//  and also if you need to use the random fn later in the art.js that was seeded by the hash you can also pass that along in your hashToTraits fn 
//  or you can re seed using the hash again, really up to you
//  
// 3) (with above, figure out what to do with random numbers for cutX and some other randoms near doDivisions function)
// 4) (also, move some randomDate (others?) functions into another area)
//
//  so all the files will be glued  together into the same file
//  (art.js + traits.js) and (metadata.js + traits.js)
//-----------------------------------------------------------------------------
// declaration block
//-----------------------------------------------------------------------------

let hash;
let seed;
let canvas;
let lineLayers;
let dvs = [];
let portals = [];
let canvasWidth;
let canvasHeight;
let pStartX;
let pEndX;
let pStartY;
let pEndY;
let fltTwk = 10;
let rdPal;
let bgCl = '#000000'
let chaosBG;
let metadata = {};
let paused = false;
let ySlantTweak;
let stStrWght;
let divNum;
let rotCh;
let curveCh;
let animCounter = 0;
let randomDOY;

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

/**
 * Example of setting up a canvas with p5.js.
 */
function setup() {

  // in case tokenState not set, initialize it
  initialTokenState();

  // grab hash from tokenData
  hash = tokenData.hash;
  console.log('hash: ', hash);
  let {
    seed,
    rdPal
  } = hashToTraits(tokenData.hash);

  console.log('pallete found was: ', rdPal);
  //seed = parseInt(hash.slice(0, 16), 16)
  //randomSeed(seed);
  //console.log('tokenData.hash is: ', tokenData.hash);

  // for now, assuming same height as width (and using window height as default)
  // the defined x/y edges of a 'portal' is always a percentage size of the height of the canvas
  canvasWidth   = windowHeight;
  canvasHeight  = windowHeight;
  pStartX       = canvasWidth * 0.25;     
  pEndX         = canvasWidth * 0.75;      
  pStartY       = canvasHeight * 0.25;    
  pEndY         = canvasHeight * 0.75;      
  lineLayers    = canvasHeight / 2;

   // default frame-rate is 8
  frameRate(8);                                              

  // all random variables!
  // rdPal = random(pallettes);                                                          // pick a random color
  rotCh = parseInt(random(1, 10)) >= 9 ? true : false;                                // 2 in 10 chance to randomly rotate the canvas 
  divNum = parseInt(random(2, 10));                                                   // we can have between 2 - 10 color divisions
  chaosBGChance = random(1,10);                                                       // 2 in 10 chance of non-harmonious 'chaos' (any color!) background
  bgCl = chaosBGChance < 8                                                            // define the bg color as either a dulled/lightened color in the pallette,
    ? changeColourPercentage(random(rdPal), random(0.25, 0.75))                       // or a 'chaos' color
    : color(random(255), random(255), random(255));
  let slantAdd = 0;                                                                   // default 'slant' angle is endY pos of portal - startY pos of portal / 4,
  ySlantTweak = (pEndY - pStartY) / 4;                                                // there's a 50% chance this will get applied
  if(random(1,10) > 5) { 
    slantAdd = ySlantTweak;
  }
  stStrWght = parseInt(random(2,4));                                                  // the line weight of each strand can be between 2 (stringy) - 4 (solid)
  curveCh = parseInt(random(1, 10)) >= 9 ? true : false;                              // 2 in 10 chance of sweeping bezier curves for some divisions
  randomDOY = randomDate(new Date(2012, 0, 1), new Date());                           // on a random day/month of the year, the script will slide-animate for the entire day.
  
  // create canvas
  canvas = createCanvas(canvasWidth, canvasHeight);

  // perhaps rotate it
  if (rotCh) { canvas.style(`transform: rotate(270deg)`); }

  // push defined portal to array
  portals.push([
    0.1, 
    1, 
    pStartX, 
    pEndX, 
    pStartY, 
    pEndY, 
    createDvs(rdPal, (pEndY - pStartY), pStartX, pEndX, divNum), 
    ySlantTweak, 
    slantAdd, 
    stStrWght,
    curveCh
  ]);

  // write out our metadata!
  metadata = [
    {
      trait_type: "Divisions",
      value: portals[0][6].length
    }, {
      trait_type: "UncutStyle",
      value: slantAdd > 0 ? 'Lifted' : 'Flat',
    }, { 
      trait_type: "BackgroundStyle",
      value: chaosBGChance < 8 ? "Harmonious" : "Random",
    }, {
      trait_type: "InitialStrokeWeight",
      value: stStrWght,
    }, {
      trait_type: "Rotation",
      value: rotCh ? 'Ascending' : 'Normal',
    }, {
      trait_type: "LineStyle",
      value: curveCh ? 'Curved' : 'Straight',
    }, {
      trait_type: "LiftingOn",
      value: randomDOY.getDate() + '-' + randomDOY.getMonth(),
    }
  ];
  console.log(metadata);
  
  // place an initial portal, just in case script starts off non-animated
  placePortal();

}

//-----------------------------------------------------------------------------

/**
 * Draw is required to be defined for processing library to load into the
 *  global scope.
 */
function draw() {

  // only animate if moving is true
  if (tokenState.moving) {
    
    placePortal();

    // if a particular day and month, slowly animate the script further for the entire day.
    if ((new Date().getDate() === randomDOY.getDate()) && (new Date().getMonth() === randomDOY.getMonth())) {
      animCounter = animCounter + 100;
      tokenState.divXSlide = sin(animCounter / 8000) * 100;
      tokenState.flattenAng = sin(animCounter / 8000) * 100;
    }
  }
  
}

// define our canvas bg and draw a portal.. pulled out of draw() function so that setup() can call this initially for non-animated states
function placePortal() {
  background(bgCl);                                           // set bg color
  fltTwk = 10 + tokenState.flutterAdd;                        // default flutter tweak is 10, plus/minus user setting
  noFill();

  // for as many portals as are defined (always 1, currently), draw it!
  for(let p = 0; p < portals.length; p++) {
    drawPortal(
        ...portals[p]
    );
  }
}

// in case tokenState not set, initialize it
function initialTokenState() {
  if (typeof tokenState.lineThickness === 'undefined') { tokenState.lineThickness = 0; }
  if (typeof tokenState.flutterAdd === 'undefined') { tokenState.flutterAdd = 0; }
  if (typeof tokenState.divXSlide === 'undefined') { tokenState.divXSlide = 0; }
  if (typeof tokenState.flattenAng === 'undefined') { tokenState.flattenAng = 0; }
  if (typeof tokenState.moving === 'undefined') { tokenState.moving = true; }
}

//-----------------------------------------------------------------------------------------------------------------------------------
// OUR MAIN FUNCTION THAT PULLS IT ALL TOGETHER AND DRAWS A DAMN PORTAL
//-----------------------------------------------------------------------------------------------------------------------------------

function drawPortal(heightPos, heightPosIncr, xStart, xEnd, yStart, yEnd, sentDiv, ySlantTweak, slantAdd, stStrWght, curveCh) {

  // how many string 'lines' we'll be drawing
  let lineLayers = yEnd - yStart;

  // create dvs for our portal
  let dvs = sentDiv;

  // let's draw our central interference object
  for (let i = 0; i < lineLayers; i++) {

    // set a stroke weight
    strokeWeight(stStrWght + tokenState.lineThickness);

    // define slightly random widths / line height starting positions, to create flutter effect
    let xpos1 = xStart + random(fltTwk);
    let xpos2 = xEnd - random(fltTwk);
    let ypos1 = yStart + heightPos + random(fltTwk / 2);
    let ypos2 = yStart + heightPos + random(fltTwk / 2);

    // draw an interference line
    if (ypos1 < yEnd) { // this 'if' is what cuts it off at the bottom. maybe needs work... TODO

      // grab a color from the found division
      stroke(setColorY(i, dvs));

      // if there's an X cut, draw both colored lines, otherwise just solid line
      if(checkXDiv(i, dvs)) {

        // draw either an angled cutX line, or a pouring/droopy one...
        cutXStyle = dvs.find((el) => i < el.cutY).cutXstyle;
        if(cutXStyle !== null) {
          lineTypeXTweak = (xEnd - xStart) / 16;
          drawLine(xpos1, xpos2, ypos1, ypos2, 0, ySlantTweak + tokenState.flattenAng, false, xStart, xEnd, yStart, yEnd, cutXStyle, i, dvs);
        } else {
          lineTypeXTweak = 0;
          drawCutXLine(dvs, xpos1, ypos1, ypos2, i, ySlantTweak + tokenState.flattenAng, xpos2);
        }

        // ensure we're not going over the right-most X bound
        tempLen = dvs.find((el) => i < el.cutY).cutX + random(fltTwk) + lineTypeXTweak + tokenState.divXSlide;
        tempXPos2 =  tempLen > xpos2 ? xpos2 :  tempLen < xpos1 ? xpos1 : tempLen;

        // draw shadow line for above
        if (ySlantTweak + tokenState.flattenAng > 0) {
          drawLine(xpos1, tempXPos2, ypos1, ypos2, 0, 0, curveCh, xStart, xEnd, yStart, yEnd, "shadow_dark");
        }

        // draw the rest of the divided line, using cutX's colour..
        stroke(setColorX(i, dvs));
        drawLine(tempXPos2, xpos2, ypos1, ypos2, 0, 0, false);
          
      } else {
        drawLine(xpos1, xpos2, ypos1, ypos2, slantAdd + tokenState.flattenAng, 0, curveCh, xStart, xEnd, yStart, yEnd, "uncut");

        // shadow line, if we're slanted
        if (slantAdd + tokenState.flattenAng > 0) {
          drawLine(xpos1, xpos2, ypos1, ypos2, 0, 0, false, xStart, xEnd, yStart, yEnd, "shadow_light");
        }
      
      }
    
    }

    noStroke();

    // move on to the next line postiion
    heightPos = heightPos + heightPosIncr;
  }
}

//-----------------------------------------------------------------------------------------------------------------------------------
// DRAWING FUNCTIONS
//-----------------------------------------------------------------------------------------------------------------------------------

// when we want to draw line that doesn't have a vertical division.. basically a 'solid' line. can be flat, or 'lifted'. and can curve crazily.
function drawLine(xpos1, xpos2, ypos1, ypos2, slantAdd, ySlantTweak, curveCh, xStart, xEnd, yStart, yEnd, lineStyle, counter, dvs) {

  let 
    cpx1,
    cpy1,
    cpx2,
    cpy2,
    currCutX;

  if (lineStyle === 'shadow_dark') {
    stroke(changeColourPercentage(random(rdPal), random(0.1, 0.4)));
  } else if (lineStyle === 'shadow_light') {
    stroke(changeColourPercentage(random(rdPal), random(0.5, 0.75)));
  } else if (lineStyle === 'droopy') {
    currCutX = dvs.find((el) => counter < el.cutY).cutX;
    // bezier curve points 
    cpx1 = (random(xpos1 + ((xEnd - xStart) / 20), xpos1)) + ((xEnd - xStart) / 4), 
    cpy1 = (random(ypos1 + ((yEnd - yStart) / 20), ypos1) + random(fltTwk / 2)), 
    cpx2 = (random(currCutX + ((xEnd - xStart) / 20), currCutX) + random(fltTwk)),  
    cpy2 = (random(ypos2 + ((yEnd - yStart) / 20), ypos2)) - ((yEnd - yStart) / 20);
  } else if (lineStyle === 'pouring') {
    currCutX = dvs.find((el) => counter < el.cutY).cutX;
    // bezier curve points
    cpx1 = (random(xpos1 + ((xEnd - xStart) / 20), xpos1)) + ((xEnd - xStart) / 4),
    cpy1 = (random(ypos1 + ((yEnd - yStart) / 20), ypos1) - ySlantTweak + random(fltTwk / 2)) + ((yEnd - yStart) / 20),
    cpx2 = (random(currCutX + ((xEnd - xStart) / 20), currCutX) + random(fltTwk)) - ((xEnd - xStart) / 40),
    cpy2 = (random(ypos2 + ((yEnd - yStart) / 20), ypos2)) - ((yEnd - yStart) / 20);
  }

  if (lineStyle === 'droopy' || lineStyle === 'pouring') {
        // ensure we don't go over the right-hand width
        tempLen = currCutX + random(fltTwk) + ((xEnd - xStart) / 20) + tokenState.divXSlide;
        tempXPos2 =  tempLen > xpos2 ? xpos2 :  tempLen < xpos1 ? xpos1 : tempLen;
    
        bezier(
            xpos1, 
            ypos1 - ySlantTweak + random(fltTwk / 2), 
            cpx1, 
            cpy1, 
            cpx2, 
            cpy2, 
            tempXPos2, 
            ypos2
        );
  } else {
    let tempYPos2 = slantAdd > 0 ? ypos2 - slantAdd + random(fltTwk / 2) : ypos2;
    if (curveCh) {
      // bezier curve points
      let 
      cpx1 = (xStart + xEnd) / 2, 
      cpy1 = (ypos1 - ((yEnd - yStart) / 4)), 
      cpx2 = (xStart + xEnd) / 2,  
      cpy2 = (ypos1 + ((yEnd - yStart) / 4));
      
      bezier(
        xpos1, 
        ypos1 - ySlantTweak + random(fltTwk / 2), 
        cpx1, 
        cpy1, 
        cpx2, 
        cpy2, 
        xpos2, 
        tempYPos2
      );
    
    } else {
      line(
        xpos1, 
        ypos1, 
        xpos2, 
        tempYPos2
      );
    }
  }
}

// when we want to draw one of the 'cutX' thread lines..
function drawCutXLine(dvs, xpos1, ypos1, ypos2, counter, ySlantTweak, endXpos) {

  // ensure we don't go over the right-hand width, nor before 1st xpos point
  tempLen = dvs.find((el) => counter < el.cutY).cutX + tokenState.divXSlide + random(fltTwk);
  tempXPos2 =  tempLen > endXpos ? endXpos : tempLen < xpos1 ? xpos1 : tempLen;

  line(
    xpos1, 
    ypos1 - ySlantTweak + random(fltTwk / 2), 
    tempXPos2, 
    ypos2
  );
}

//-----------------------------------------------------------------------------------------------------------------------------------
// DIVISION-SPECIFIC FUNCTIONS
//-----------------------------------------------------------------------------------------------------------------------------------

function createDvs(rdPal, lineLayers, pStartX, pEndX, divNum) {
  let dvs = [];
  let runningCut = parseInt(lineLayers / divNum);
  let pi = 0;
  let cutXRandomChance = 0;
  let tempColor = '#000000';

  for (let i = 0; i < divNum; i++) {
    cutXRandomChance = random(1, 10);
    
    // ensure we cycle through pallette colours, rather than running out if undefined
    if (typeof rdPal[`${i + 1}`] === 'undefined'){
      tempColor = rdPal[`${pi}`];
      pi++;
    } else {
      tempColor = rdPal[`${i + 1}`];
    }

    // determine whether we randomly add a cutX
    if (cutXRandomChance > 4) {
      cutX = random((pStartX + fltTwk), (pEndX - fltTwk));
      colorX = random(rdPal);
      if(random(10) <= 8){
          cutXstyle = null; //none
      } else {
        if(random(10) <= 5){
          cutXstyle = "droopy"; //droopy
        } else {
          cutXstyle = "pouring"; //pouring
        }
      }
    } else {
      cutX = null;
      colorX = null;
      cutXstyle = null;
    }
    
    let tempObj = {
      cutY: runningCut,
      color: tempColor,
      cutX: cutX,
      colorX: colorX,
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

function setColorY(i, dvs) {
  let foundCol = '#FFFFFF'

  foundCol =
    !('color' in dvs.find((el) => i < el.cutY)) ||
    typeof dvs.find((el) => i < el.cutY).color === 'undefined'
      ?  dvs[parseInt(random(0, (dvs.length < 4 ? dvs.length : 4)))].color
      : dvs.find((el) => i < el.cutY).color;

  return color(foundCol);
}

function setColorX(i, dvs) {
  let foundCol = '#FFFFFF'
  if (dvs.find((el) => i < el.cutY).cutX !== null) {
    foundCol = dvs.find((el) => i < el.cutY).colorX;
  }
  return color(foundCol);
}

function checkXDiv(i, dvs) {
  if (dvs.find((el) => i < el.cutY).cutX !== null){
    return true;
  }
  return false;
}

//-----------------------------------------------------------------------------------------------------------------------------------
// OTHER FUNCTIONS
//-----------------------------------------------------------------------------------------------------------------------------------

// dulls / intensifies a colour by changing its percentage. Wow!
function changeColourPercentage(colour, percentage) {
  if(typeof colour !== 'undefined'){
    let c = colour.substring(1);      // strip #
    let rgb = parseInt(c, 16);              // convert rrggbb to decimal
    let r = ((rgb >> 16) & 0xff) * percentage;             // extract red and change percentage
    let g = ((rgb >>  8) & 0xff) * percentage;             // extract green
    let b = ((rgb >>  0) & 0xff) * percentage;             // extract blue
    return color(r,g,b);
  } else {
    return colour;
  } 
}

// on setup, get a random date (deterministic from seed)
function randomDate(start, end) {
  return new Date(start.getTime() + random(1) * (end.getTime() - start.getTime()));
}
