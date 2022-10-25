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

  let { cvW, cvH } = hashToTraits(hash);

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
  // set background colour
  background(tokenState.bgCol);

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
