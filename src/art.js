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
  // this is the random hash, different every page refresh (basically different for every generated artwork), script can use this hash to do random generations
  hash = fxhash;

  // Try uncommenting this line below! You'll set the hash to be the same every time.. notice that the artwork will now always generate the same result, if you reload the page.
  // hash = 'ooxCBqdymaLnvsBcrXSahPUAxg2iZQya6cckbKANB9iPhcVqqbA';

  // just so we can see the hash in Console..
  console.log('hash:', hash);

  // ensure any time you use the random() or noise() functions, they're tied to the hash, and thus consistent!
  randomSeed(hash);
  noiseSeed(hash);

  //----------

  // grab our random variables from traits.js
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

  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  // actually draw some stuff...  you can do this here in setup() (which is a once-off draw) or in draw() (which will draw something every frame - animations, etc.)
  // this is where you'd paste your personal art code, and ensure it uses the random stuff (such as random palettes, etc.) from traits.js.
  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  // set background colour from our random bg color in traits.js
  background(bgCol);

  // draw a damn square - fill it with our random color
  fill(randPal);
  square(20, 20, 50);

  //---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  //FXHash!! - when to take a snapshot of your script for a preview image on Fxhash site
  if (!fxPrevOccurred) {
    fxpreview();
    fxPrevOccurred = true;
  }
}

// put stuff here if you want to draw something every frame - animations, etc., but otherwise put it in setup()
function draw() {}
