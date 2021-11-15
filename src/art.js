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
    stStrWght,
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
    stStrWght,
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
    //if ((new Date().getDate() === tokenState.randomDOY.getDate()) && (new Date().getMonth() === tokenState.randomDOY.getMonth())) {
      tokenState.animCounter = tokenState.animCounter + 100;
      tokenState.divXSlide = sin(tokenState.animCounter / 8000) * 100;
      tokenState.flattenAng = sin(tokenState.animCounter / 8000) * 100;
    //}
  }
  
}

// define our canvas bg and draw a portal.. pulled out of draw() function so that setup() can call this initially for non-animated states
function placePortal() {
  background(tokenState.bgCl);                                           // set bg color
  tokenState.fltTwk = 10 + tokenState.flutterAdd;                        // default flutter tweak is 10, plus/minus user setting
  noFill();

  // for as many portals as are defined (always 1, currently), draw it!
  for(let p = 0; p < tokenState.portals.length; p++) {
    drawPortal(
        ...tokenState.portals[p]
    );
  }
}

//-----------------------------------------------------------------------------------------------------------------------------------
// OUR MAIN FUNCTION THAT PULLS IT ALL TOGETHER AND DRAWS A DAMN PORTAL
//-----------------------------------------------------------------------------------------------------------------------------------

function drawPortal(heightPos, heightPosIncr, xStart, xEnd, yStart, yEnd, sentDiv, ySlantTweak, slantAdd, stStrWght, curveCh, rdPal) {

  // how many string 'lines' we'll be drawing
  let lineLayers = yEnd - yStart;

  // create dvs for our portal
  let dvs = sentDiv;

  // let's draw our central interference object
  for (let i = 0; i < lineLayers; i++) {

    // set a stroke weight
    strokeWeight(stStrWght + tokenState.lineThickness);

    // define slightly random widths / line height starting positions, to create flutter effect
    let xpos1 = xStart + random(tokenState.fltTwk);
    let xpos2 = xEnd - random(tokenState.fltTwk);
    let ypos1 = yStart + heightPos + random(tokenState.fltTwk / 2);
    let ypos2 = yStart + heightPos + random(tokenState.fltTwk / 2);

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
        tempLen = dvs.find((el) => i < el.cutY).cutX + random(tokenState.fltTwk) + lineTypeXTweak + tokenState.divXSlide;
        tempXPos2 =  tempLen > xpos2 ? xpos2 :  tempLen < xpos1 ? xpos1 : tempLen;

        // draw shadow line for above
        if (ySlantTweak + tokenState.flattenAng > 0) {
          drawLine(xpos1, tempXPos2, ypos1, ypos2, 0, 0, curveCh, xStart, xEnd, yStart, yEnd, "shadow_dark", null, null, rdPal);
        }

        // draw the rest of the divided line, using cutX's colour..
        stroke(setColorX(i, dvs));
        drawLine(tempXPos2, xpos2, ypos1, ypos2, 0, 0, false);
          
      } else {
        drawLine(xpos1, xpos2, ypos1, ypos2, slantAdd + tokenState.flattenAng, 0, curveCh, xStart, xEnd, yStart, yEnd, "uncut");

        // shadow line, if we're slanted
        if (slantAdd + tokenState.flattenAng > 0) {
          drawLine(xpos1, xpos2, ypos1, ypos2, 0, 0, false, xStart, xEnd, yStart, yEnd, "shadow_light", null, null, rdPal);
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
    currCutX;

  if (lineStyle === 'shadow_dark') {
    stroke(changeColourPercentage(random(rdPal), random(0.1, 0.4)));
  } else if (lineStyle === 'shadow_light') {
    stroke(changeColourPercentage(random(rdPal), random(0.5, 0.75)));
  } else if (lineStyle === 'droopy') {
    currCutX = dvs.find((el) => counter < el.cutY).cutX;
    // bezier curve points 
    cpx1 = (random(xpos1 + ((xEnd - xStart) / 20), xpos1)) + ((xEnd - xStart) / 4), 
    cpy1 = (random(ypos1 + ((yEnd - yStart) / 20), ypos1) + random(tokenState.fltTwk / 2)), 
    cpx2 = (random(currCutX + ((xEnd - xStart) / 20), currCutX) + random(tokenState.fltTwk)),  
    cpy2 = (random(ypos2 + ((yEnd - yStart) / 20), ypos2)) - ((yEnd - yStart) / 20);
  } else if (lineStyle === 'pouring') {
    currCutX = dvs.find((el) => counter < el.cutY).cutX;
    // bezier curve points
    cpx1 = (random(xpos1 + ((xEnd - xStart) / 20), xpos1)) + ((xEnd - xStart) / 4),
    cpy1 = (random(ypos1 + ((yEnd - yStart) / 20), ypos1) - ySlantTweak + random(tokenState.fltTwk / 2)) + ((yEnd - yStart) / 20),
    cpx2 = (random(currCutX + ((xEnd - xStart) / 20), currCutX) + random(tokenState.fltTwk)) - ((xEnd - xStart) / 40),
    cpy2 = (random(ypos2 + ((yEnd - yStart) / 20), ypos2)) - ((yEnd - yStart) / 20);
  }

  if (lineStyle === 'droopy' || lineStyle === 'pouring') {
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
