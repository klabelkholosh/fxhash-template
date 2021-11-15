//-----------------------------------------------------------------------------
// art.js - art generation
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------
function setup() {

  // grab hash from tokenData
  hash = tokenData.hash;

  let {
    seed,
    rdPal,
    slantAdd,
    ySlantTweak,
    stWt,
    curveCh,
    divs,
    canvasWidth,
    canvasHeight,
    pStartX,
    pEndX,
    pStartY,
    pEndY
  } = hashToTraits(hash);

  // default frame-rate is 8
  frameRate(8);                                              

  // create canvas
  canvas = createCanvas(canvasWidth, canvasHeight);

  // push defined portal to array
  tokenState.portals.push([
    0.1, 
    1, 
    pStartX, 
    pEndX, 
    pStartY, 
    pEndY, 
    divs,
    ySlantTweak, 
    slantAdd, 
    stWt,
    curveCh,
    rdPal
  ]);
  
  // rotate if we need to
  if(tokenState.rotCh) {
    translate(innerWidth/ 50, innerHeight/ 1.015);
    rotate(-1.575);
  }

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
    
    // rotate if we need to
    if(tokenState.rotCh) {
      translate(innerWidth/ 50, innerHeight/ 1.015);
      rotate(-1.575);
    }

    // draw the portal
    placePortal();
    
    // if a particular day and month, slowly animate the script further for the entire day.
    if ((new Date().getDate() === tokenState.rndDy.getDate()) && (new Date().getMonth() === tokenState.rndDy.getMonth())) {
      let sgma = sin(tokenState.anmC / 8000) * 100
      tokenState.anmC = tokenState.anmC + 100;
      tokenState.divXSlide = sgma;
      tokenState.flatA = sgma;
    }
  }
  
}

// define our canvas bg and draw a portal.. pulled out of draw() function so that setup() can call this initially for non-animated states
function placePortal() {
  background(tokenState.bgCl);                                           // set bg color
  tokenState.fltTwk = 10 + tokenState.flutA;                             // default flutter tweak is 10, plus/minus user setting
  noFill();

  // for as many portals as are defined (always 1, currently), draw it!
  drawPortal(...tokenState.portals[0]);
}

//-----------------------------------------------------------------------------------------------------------------------------------
// OUR MAIN FUNCTION THAT PULLS IT ALL TOGETHER AND DRAWS A DAMN PORTAL
//-----------------------------------------------------------------------------------------------------------------------------------

function drawPortal(heightPos, heightPosIncr, xStart, xEnd, yStart, yEnd, sentDiv, ySlantTweak, slantAdd, stWt, curveCh, rdPal) {

  // how many string 'lines' we'll be drawing
  let lineLayers = yEnd - yStart;

  // create dvs for our portal
  let dvs = sentDiv;

  // let's draw our central interference object
  for (let i = 0; i < lineLayers; i++) {

    // set a stroke weight
    strokeWeight(stWt + tokenState.lnThk);

    // define slightly random widths / line height starting positions, to create flutter effect
    let fT = random(tokenState.fltTwk);
    let xpos1 = xStart + fT;
    let xpos2 = xEnd - fT;
    let ypos1 = yStart + heightPos + fT / 2;
    let ypos2 = yStart + heightPos + fT / 2;

    // draw an interference line
    if (ypos1 < yEnd) { // this 'if' is what cuts it off at the bottom. maybe needs work... TODO

      // grab a color from the found division
      stroke(setColorY(i, dvs));

      // if there's an X cut, draw both colored lines, otherwise just solid line
      if(checkXDiv(i, dvs)) {

        // draw either an angled cutX line, or a pouring/droopy one...
        cutXStyle = dvs.find((el) => i < el.cutY).cutXstyle;
        if(cutXStyle !== null) {
          ltXtw = (xEnd - xStart) / 16;
          drawLine(xpos1, xpos2, ypos1, ypos2, 0, ySlantTweak + tokenState.flatA, false, xStart, xEnd, yStart, yEnd, cutXStyle, i, dvs);
        } else {
          ltXtw = 0;
          drawCutXLine(dvs, xpos1, ypos1, ypos2, i, ySlantTweak + tokenState.flatA, xpos2);
        }

        // ensure we're not going over the right-most X bound
        tempLen = dvs.find((el) => i < el.cutY).cutX + random(tokenState.fltTwk) + ltXtw + tokenState.divXSlide;
        tempXPos2 =  tempLen > xpos2 ? xpos2 :  tempLen < xpos1 ? xpos1 : tempLen;

        // draw shadow line for above
        if (ySlantTweak + tokenState.flatA > 0) {
          drawLine(xpos1, tempXPos2, ypos1, ypos2, 0, 0, curveCh, xStart, xEnd, yStart, yEnd, "1", null, null, rdPal);
        }

        // draw the rest of the divided line, using cutX's colour..
        stroke(setColorX(i, dvs));
        drawLine(tempXPos2, xpos2, ypos1, ypos2, 0, 0, false);
          
      } else {
        drawLine(xpos1, xpos2, ypos1, ypos2, slantAdd + tokenState.flatA, 0, curveCh, xStart, xEnd, yStart, yEnd, "uncut");

        // shadow line, if we're slanted
        if (slantAdd + tokenState.flatA > 0) {
          drawLine(xpos1, xpos2, ypos1, ypos2, 0, 0, false, xStart, xEnd, yStart, yEnd, "2", null, null, rdPal);
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
function drawLine(xpos1, xpos2, ypos1, ypos2, slantAdd, ySlantTweak, curveCh, xStart, xEnd, yStart, yEnd, lineStyle, counter, dvs, rdPal) {

  let 
    cpx1,
    cpy1,
    cpx2,
    cpy2,
    currCutX = lineStyle === "3" || lineStyle === "4" ? dvs.find((el) => counter < el.cutY).cutX : null,
    bz1 = (random(xpos1 + ((xEnd - xStart) / 20), xpos1))  + ((xEnd - xStart) / 4),
    bz2 = random(ypos1 + ((yEnd - yStart) / 20), ypos1),
    bz3 = random(currCutX + ((xEnd - xStart) / 20), currCutX) + random(tokenState.fltTwk),
    bz4 = (random(ypos2 + ((yEnd - yStart) / 20), ypos2)) - ((yEnd - yStart) / 20);

    if (lineStyle === "1") { // shadow dark
      stroke(changeCC(random(rdPal), random(0.1, 0.4)));
    } else if (lineStyle === "2") { //shadow_light
      stroke(changeCC(random(rdPal), random(0.5, 0.75)));
    } else if (lineStyle === "3" || lineStyle === "4") { // droopy or pouring
     
      // bezier curve points 
      cpx1 = bz1; 
      cpy1 = lineStyle === "3" ? (bz2 + random(tokenState.fltTwk / 2)) : (bz2 - ySlantTweak + random(tokenState.fltTwk / 2)) + ((yEnd - yStart) / 20); 
      cpx2 = lineStyle === "3" ? bz3 : (bz3) - ((xEnd - xStart) / 40);  
      cpy2 = bz4;
    }

  if (lineStyle === "3" || lineStyle === "4") {
        // ensure we don't go over the right-hand width
        tempLen = currCutX + random(tokenState.fltTwk) + ((xEnd - xStart) / 20) + tokenState.divXSlide;
        tempXPos2 =  tempLen > xpos2 ? xpos2 :  tempLen < xpos1 ? xpos1 : tempLen;
    
        bezier(
            xpos1, 
            ypos1 - ySlantTweak + random(tokenState.fltTwk / 2), 
            cpx1, 
            cpy1, 
            cpx2, 
            cpy2, 
            tempXPos2,
            ypos2
        );
  } else {
    let tempYPos2 = slantAdd > 0 ? ypos2 - slantAdd + random(tokenState.fltTwk / 2) : ypos2;
    if (curveCh) {
      // bezier curve points
      let 
      cpx1 = (xStart + xEnd) / 2, 
      cpy1 = (ypos1 - ((yEnd - yStart) / 4)), 
      cpx2 = (xStart + xEnd) / 2,  
      cpy2 = (ypos1 + ((yEnd - yStart) / 4));
      
      bezier(
        xpos1, 
        ypos1 - ySlantTweak + random(tokenState.fltTwk / 2), 
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
  tempLen = dvs.find((el) => counter < el.cutY).cutX + tokenState.divXSlide + random(tokenState.fltTwk);
  tempXPos2 =  tempLen > endXpos ? endXpos : tempLen < xpos1 ? xpos1 : tempLen;

  line(
    xpos1, 
    ypos1 - ySlantTweak + random(tokenState.fltTwk / 2), 
    tempXPos2, 
    ypos2
  );
}

//-----------------------------------------------------------------------------------------------------------------------------------
// DIVISION-SPECIFIC FUNCTIONS
//-----------------------------------------------------------------------------------------------------------------------------------

// grab Y color from a division definition
function setColorY(i, dvs) {
  let foundCol = '#FFFFFF'

  foundCol =
    !('color' in dvs.find((el) => i < el.cutY)) ||
    typeof dvs.find((el) => i < el.cutY).color === 'undefined'
      ?  dvs[parseInt(random(0, (dvs.length < 4 ? dvs.length : 4)))].color
      : dvs.find((el) => i < el.cutY).color;

  return color(foundCol);
}

// grab X color from a division definition
function setColorX(i, dvs) {
  let foundCol = '#FFFFFF'
  if (dvs.find((el) => i < el.cutY).cutX !== null) {
    foundCol = dvs.find((el) => i < el.cutY).colorX;
  }
  return color(foundCol);
}

// check if there indeed is an X cut in a division
function checkXDiv(i, dvs) {
  if (dvs.find((el) => i < el.cutY).cutX !== null){
    return true;
  }
  return false;
}
