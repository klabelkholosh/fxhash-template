// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// art.js - art generation
//-----------------------------------------------------------------------------

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

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

/**
 * Example of setting up a canvas with p5.js.
 */
function setup() {

  // initial state
  resetState();

  // grab hash from tokenData and use it to create a p5js randomSeed
  // any 'random' call after this is always deterministic to the supplied seed!
  console.log('tokenData.hash is: ', tokenData.hash);
  hash = tokenData.hash;
  seed = parseInt(hash.slice(0, 16), 16)
  randomSeed(seed);
  
  // for now, assuming same height as width (and using window height as default)
  // the defined x/y edges of a 'portal' is always a percentage size of the height of the canvas
  canvasWidth   = windowHeight;
  canvasHeight  = windowHeight;
  pStartX       = canvasWidth * 0.25;     
  pEndX         = canvasWidth * 0.75;      
  pStartY       = canvasHeight * 0.25;    
  pEndY         = canvasHeight * 0.75;      
  lineLayers    = canvasHeight / 2;

  // all random variables!
  rdPal = random(pallettes);                                                          // pick a random color
  rotCh = parseInt(random(1, 10)) >= 9 ? true : false;                                // 2 in 10 chance to randomly rotate the canvas 
  divNum = parseInt(random(2, 10));                                                   // we can between 2 - 10 color divisions
  chaosBGChance = random(1,10);                                                       // 2 in 10 chance of non-harmonious 'chaos' (any color!) background
  bgCl = chaosBGChance < 8
    ? changeColourPercentage(random(rdPal), random(0.25, 0.75))
    : color(random(255), random(255), random(255));
  let slantAdd = 0;                                                                   // default 'slant' angle is endY pos of portal - startY pos of portal / 4,
  ySlantTweak = (pEndY - pStartY) / 4;                                                // there's a 50% chance this will get applied
  if(random(1,10) > 5) { 
    slantAdd = ySlantTweak;
  }
  stStrWght = parseInt(random(2,4));                                                  // the line weight of each strand can be between 2 (stringy) - 4 (solid)
  curveCh = parseInt(random(1, 10)) >= 9 ? true : false;                              // 2 in 10 chance of sweeping bezier curves for some divisions

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
  metadata.portalData = portals;
  metadata.pallette = rdPal;
  metadata.bg = bgCl;
  metadata.bgStyle = chaosBGChance < 8 ? "harmonious" : "chaos";
  metadata.dvs = portals[0][6].length;
  metadata.barStyle = slantAdd > 0 ? 'lifted' : 'flat'
  metadata.strokeWeight = stStrWght;
  metadata.rotation = rotCh ? 'ascending' : 'regular';
  metadata.lineStyle = curveCh ? 'curved' : 'straight';
  console.log(metadata);

}

//-----------------------------------------------------------------------------

/**
 * Draw is required to be defined for processing library to load into the
 *  global scope.
 */
function draw() {

  /*
  const {
    shape,
    color
  } = hashToTraits(tokenData.hash);

  const hexToRGB = color => Array.from(Array(3).keys())
    .map(i => i * 2 + 1)
    .map(i => fromHex(color.slice(i, i + 2)));

  // step
  tokenState.tf = (tokenState.tf + 0.05) % (Math.PI * 2);
  */
  background(bgCl);

  frameRate(8 + tokenState.frameRate);                        // default frame-rate is 8, plus/minus user setting
  fltTwk = 10 + tokenState.flutterAdd;                        // default flutter tweak is 10, plus/minus user setting

  noFill();

  // animation attempts
  if (tokenState.animateThis === true) {
    tokenState.divXSlide = sin(millis() / 4000) * 100;
    tokenState.flattenAng = sin(millis() / 4000) * 100;
  }


  // for as many portals as are defined (always 1, currently), draw it!
  for(let p = 0; p < portals.length; p++) {
    drawPortal(
        ...portals[p]
     );
  }
}

function keyPressed() {
  // pause the script!
  if ( key == 'p' ) {
    paused = !paused;
    paused ? noLoop() : loop();
  }

  // reset the state
  if ( key == 'r' ) {
    resetState();
  }

  // animate / unanimate it
  if ( key == 'a' ) {
    tokenState.animateThis = !tokenState.animateThis;
  }
}

// set user settings back to original
function resetState() {
  tokenState.divXSlide = 0;
  tokenState.lineThickness = 0;
  tokenState.flattenAng = 0;
  tokenState.frameRate = 0;
  tokenState.flutterAdd = 0;
  tokenState.animateThis = false;
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
    strokeWeight(stStrWght + tokenState.lineThickness); // old was random(1)

    // define slightly random widths / line height starting positions - they're mostly straight, but need to jiggle and look like interference / static...
    let xpos1 = xStart + random(fltTwk);
    let xpos2 = xEnd - random(fltTwk);
    let ypos1 = yStart + heightPos + random(fltTwk / 2); // heightPos + 90
    let ypos2 = yStart + heightPos + random(fltTwk / 2); // heightPos - 45;

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
        // curveCh
        drawLine(xpos1, xpos2, ypos1, ypos2, slantAdd + tokenState.flattenAng, 0, curveCh, xStart, xEnd, yStart, yEnd, "uncut");

        // shadow line, if we're slanted
        // curveCh
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
  // console.log('cpy1:', cpy1);
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

//-----------------------------------------------------------------------------------------------------------------------------------
// ARTBLOCKS FUNCTIONS
//-----------------------------------------------------------------------------------------------------------------------------------

function random_hash() {
  let x = "0123456789abcdef", hash = '0x'
  for (let i = 64; i > 0; --i) {
    hash += x[Math.floor(Math.random()*x.length)]
  }
  return hash
}

let pallettes = [["#69d2e7","#a7dbd8","#e0e4cc","#f38630","#fa6900"],
["#fe4365","#fc9d9a","#f9cdad","#c8c8a9","#83af9b"],
["#ecd078","#d95b43","#c02942","#542437","#53777a"],
["#556270","#4ecdc4","#c7f464","#ff6b6b","#c44d58"],
["#774f38","#e08e79","#f1d4af","#ece5ce","#c5e0dc"],
["#e8ddcb","#cdb380","#036564","#033649","#031634"],
["#490a3d","#bd1550","#e97f02","#f8ca00","#8a9b0f"],
["#594f4f","#547980","#45ada8","#9de0ad","#e5fcc2"],
["#00a0b0","#6a4a3c","#cc333f","#eb6841","#edc951"],
["#e94e77","#d68189","#c6a49a","#c6e5d9","#f4ead5"],
["#3fb8af","#7fc7af","#dad8a7","#ff9e9d","#ff3d7f"],
["#d9ceb2","#948c75","#d5ded9","#7a6a53","#99b2b7"],
["#ffffff","#cbe86b","#f2e9e1","#1c140d","#cbe86b"],
["#efffcd","#dce9be","#555152","#2e2633","#99173c"],
["#343838","#005f6b","#008c9e","#00b4cc","#00dffc"],
["#413e4a","#73626e","#b38184","#f0b49e","#f7e4be"],
["#ff4e50","#fc913a","#f9d423","#ede574","#e1f5c4"],
["#99b898","#fecea8","#ff847c","#e84a5f","#2a363b"],
["#655643","#80bca3","#f6f7bd","#e6ac27","#bf4d28"],
["#00a8c6","#40c0cb","#f9f2e7","#aee239","#8fbe00"],
["#351330","#424254","#64908a","#e8caa4","#cc2a41"],
["#554236","#f77825","#d3ce3d","#f1efa5","#60b99a"],
["#5d4157","#838689","#a8caba","#cad7b2","#ebe3aa"],
["#8c2318","#5e8c6a","#88a65e","#bfb35a","#f2c45a"],
["#fad089","#ff9c5b","#f5634a","#ed303c","#3b8183"],
["#ff4242","#f4fad2","#d4ee5e","#e1edb9","#f0f2eb"],
["#f8b195","#f67280","#c06c84","#6c5b7b","#355c7d"],
["#d1e751","#ffffff","#000000","#4dbce9","#26ade4"],
["#1b676b","#519548","#88c425","#bef202","#eafde6"],
["#5e412f","#fcebb6","#78c0a8","#f07818","#f0a830"],
["#bcbdac","#cfbe27","#f27435","#f02475","#3b2d38"],
["#452632","#91204d","#e4844a","#e8bf56","#e2f7ce"],
["#eee6ab","#c5bc8e","#696758","#45484b","#36393b"],
["#f0d8a8","#3d1c00","#86b8b1","#f2d694","#fa2a00"],
["#2a044a","#0b2e59","#0d6759","#7ab317","#a0c55f"],
["#f04155","#ff823a","#f2f26f","#fff7bd","#95cfb7"],
["#b9d7d9","#668284","#2a2829","#493736","#7b3b3b"],
["#bbbb88","#ccc68d","#eedd99","#eec290","#eeaa88"],
["#b3cc57","#ecf081","#ffbe40","#ef746f","#ab3e5b"],
["#a3a948","#edb92e","#f85931","#ce1836","#009989"],
["#300030","#480048","#601848","#c04848","#f07241"],
["#67917a","#170409","#b8af03","#ccbf82","#e33258"],
["#aab3ab","#c4cbb7","#ebefc9","#eee0b7","#e8caaf"],
["#e8d5b7","#0e2430","#fc3a51","#f5b349","#e8d5b9"],
["#ab526b","#bca297","#c5ceae","#f0e2a4","#f4ebc3"],
["#607848","#789048","#c0d860","#f0f0d8","#604848"],
["#b6d8c0","#c8d9bf","#dadabd","#ecdbbc","#fedcba"],
["#a8e6ce","#dcedc2","#ffd3b5","#ffaaa6","#ff8c94"],
["#3e4147","#fffedf","#dfba69","#5a2e2e","#2a2c31"],
["#fc354c","#29221f","#13747d","#0abfbc","#fcf7c5"],
["#cc0c39","#e6781e","#c8cf02","#f8fcc1","#1693a7"],
["#1c2130","#028f76","#b3e099","#ffeaad","#d14334"],
["#a7c5bd","#e5ddcb","#eb7b59","#cf4647","#524656"],
["#dad6ca","#1bb0ce","#4f8699","#6a5e72","#563444"],
["#5c323e","#a82743","#e15e32","#c0d23e","#e5f04c"],
["#edebe6","#d6e1c7","#94c7b6","#403b33","#d3643b"],
["#fdf1cc","#c6d6b8","#987f69","#e3ad40","#fcd036"],
["#230f2b","#f21d41","#ebebbc","#bce3c5","#82b3ae"],
["#b9d3b0","#81bda4","#b28774","#f88f79","#f6aa93"],
["#3a111c","#574951","#83988e","#bcdea5","#e6f9bc"],
["#5e3929","#cd8c52","#b7d1a3","#dee8be","#fcf7d3"],
["#1c0113","#6b0103","#a30006","#c21a01","#f03c02"],
["#000000","#9f111b","#b11623","#292c37","#cccccc"],
["#382f32","#ffeaf2","#fcd9e5","#fbc5d8","#f1396d"],
["#e3dfba","#c8d6bf","#93ccc6","#6cbdb5","#1a1f1e"],
["#f6f6f6","#e8e8e8","#333333","#990100","#b90504"],
["#1b325f","#9cc4e4","#e9f2f9","#3a89c9","#f26c4f"],
["#a1dbb2","#fee5ad","#faca66","#f7a541","#f45d4c"],
["#c1b398","#605951","#fbeec2","#61a6ab","#accec0"],
["#5e9fa3","#dcd1b4","#fab87f","#f87e7b","#b05574"],
["#951f2b","#f5f4d7","#e0dfb1","#a5a36c","#535233"],
["#8dccad","#988864","#fea6a2","#f9d6ac","#ffe9af"],
["#2d2d29","#215a6d","#3ca2a2","#92c7a3","#dfece6"],
["#413d3d","#040004","#c8ff00","#fa023c","#4b000f"],
["#eff3cd","#b2d5ba","#61ada0","#248f8d","#605063"],
["#ffefd3","#fffee4","#d0ecea","#9fd6d2","#8b7a5e"],
["#cfffdd","#b4dec1","#5c5863","#a85163","#ff1f4c"],
["#9dc9ac","#fffec7","#f56218","#ff9d2e","#919167"],
["#4e395d","#827085","#8ebe94","#ccfc8e","#dc5b3e"],
["#a8a7a7","#cc527a","#e8175d","#474747","#363636"],
["#f8edd1","#d88a8a","#474843","#9d9d93","#c5cfc6"],
["#046d8b","#309292","#2fb8ac","#93a42a","#ecbe13"],
["#f38a8a","#55443d","#a0cab5","#cde9ca","#f1edd0"],
["#a70267","#f10c49","#fb6b41","#f6d86b","#339194"],
["#ff003c","#ff8a00","#fabe28","#88c100","#00c176"],
["#ffedbf","#f7803c","#f54828","#2e0d23","#f8e4c1"],
["#4e4d4a","#353432","#94ba65","#2790b0","#2b4e72"],
["#0ca5b0","#4e3f30","#fefeeb","#f8f4e4","#a5b3aa"],
["#4d3b3b","#de6262","#ffb88c","#ffd0b3","#f5e0d3"],
["#fffbb7","#a6f6af","#66b6ab","#5b7c8d","#4f2958"],
["#edf6ee","#d1c089","#b3204d","#412e28","#151101"],
["#9d7e79","#ccac95","#9a947c","#748b83","#5b756c"],
["#fcfef5","#e9ffe1","#cdcfb7","#d6e6c3","#fafbe3"],
["#9cddc8","#bfd8ad","#ddd9ab","#f7af63","#633d2e"],
["#30261c","#403831","#36544f","#1f5f61","#0b8185"],
["#aaff00","#ffaa00","#ff00aa","#aa00ff","#00aaff"],
["#d1313d","#e5625c","#f9bf76","#8eb2c5","#615375"],
["#ffe181","#eee9e5","#fad3b2","#ffba7f","#ff9c97"],
["#73c8a9","#dee1b6","#e1b866","#bd5532","#373b44"],
["#805841","#dcf7f3","#fffcdd","#ffd8d8","#f5a2a2"]];
