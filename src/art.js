//-----------------------------------------------------------------------------
// art.js - art generation
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

let circles = [];
let drawPoints = [];

function setup() {

  // grab hash from tokenData
  hash = tokenData.hash;
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

  tokenData.bgCl = bgCl;
  tokenData.rdPal = rdPal;

      createCanvas(cvW, cvH);
      
      //define points we can draw in!
      for(let x=width*0.2; x<width*0.8; x++) {
          for(let y=height*0.2; y<height*0.8; y++) {
              drawPoints.push([x,y]);
          }
      }
  
      rectMode(CENTER);
  }
  
  function draw() { 
      background(tokenData.bgCl);
  
      let total = 20;                                     // so instead of just drawing one circle every draw() loop, we can do <whatevs this number is> at a time!
      let count = 0;
      let attempts = 0;
  
  
        while (count < total) {
          c = newCircle();
          if(c !== null) {
              circles.push(c);
              count++;
          }
          attempts++;
          if(attempts > 30) {                            // basically if we can't do more than this attempt in our shotgun total var blast, call it a day for draw()ing :)
              noLoop();
              console.log('DONE!', circles.length);
              break;
              
          }
        }
      
     
  
      circles.map(c => {
          if(c.growing) {
              if(c.edges()) {                                                             // if we're on an edge, stop growing!
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
          c.show();
          c.grow();
          c.edges();
      });
  }
  
  function newCircle() {
      // let spot = random(drawPoints);
      let si = int(random(0, drawPoints.length));
      let spot = drawPoints[si];
      let x = spot[0];
      let y = spot[1];
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
  
          // figure out closest circle in array and send to circle object
          let closestCirc;
          if(circles.length>0) {
              closestCirc = circles.reduce((a,b) => {
                  return dist(x, y, a.x, a.y) === dist(x, y, b.x, b.y) ? a : b;
              });
          } else {
              closestCirc = {
                  x: width/2,
                  y: height/2
              }
          }
          let tmpClr = xpPal(random(tokenData.rdPal));
          return new Circle(x,y,1.5,closestCirc, color(`#${tmpClr}`));
      } else {
          return null;
      }
  }