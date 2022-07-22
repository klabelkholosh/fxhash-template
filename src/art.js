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

    hash = "0x50e9d1028526fd285b4d5b465a9d4ad06b367c3241ba6ae8f7747f89aff01c20";

    console.log('hash:', hash);
    randomSeed(hash);

    let {
        seed,
        rdPal,
        cvW,
        cvH,
        bgCl,
        ri,
        rn
    } = hashToTraits(hash);

    let scale = 2;
    tokenData.scale = scale;
    tokenData.ri = ri;
    tokenData.rn = rn;

    tokenData.bgCl = bgCl;
    tokenData.rdPal = rdPal;
    tokenData.cvW = cvW;
    tokenData.cvH = cvH;

    createCanvas(cvW * tokenData.scale, cvH * tokenData.scale);
    bgBuf = createGraphics(cvW * tokenData.scale, cvH * tokenData.scale);
    mainBuf = createGraphics(cvW * tokenData.scale, cvH * tokenData.scale);
    onTopBuf = createGraphics(cvW * tokenData.scale, cvH * tokenData.scale);

    bgBuf.background(tokenData.bgCl);
    doCutNoise(0,0, tokenData.cvW * tokenData.scale, tokenData.cvH * tokenData.scale, 1.1,5.1, color(tokenData.bgCl), 0.1, 2, bgBuf);

    //define points we can draw in!
    for(let x=(tokenData.cvW)*0.1; x<(tokenData.cvW)*0.9; x++) {
        for(let y=(tokenData.cvH)*0.1; y<(tokenData.cvH)*0.9; y++) {
            //if(x<tokenData.cvW*0.4 || x>tokenData.cvW*0.6 || y<(tokenData.cvH * tokenData.scale)*0.4 || y>(tokenData.cvH * tokenData.scale)*0.6){ 
                    drawPoints.push([x,y]); 
            //}
        }
    }

    mainBuf.rectMode(CENTER);

}

function draw() { 
    image(bgBuf, 0, 0);
    mainBuf.clear();
    /*
    for(let x=tokenData.cvW*0.4; x<tokenData.cvW*0.6; x++) {
        for(let y=(tokenData.cvH * tokenData.scale)*0.2; y<(tokenData.cvH * tokenData.scale)*0.8; y=y+5) {
            let tmpClr = xpPal(random(tokenData.rdPal));
            if(circles.length > 0) {
                let closestCirc = circles.filter(c => c.x !== x && c.y !== y).reduce((a,b) => {                     
                    return dist(x,y, a.x, a.y) <= dist(x, y, b.x, b.y) ? a : b;
                });
                // line(tokenData.cvW*0.2, closestCirc.y, tokenData.cvW*0.4 - random(10,100), closestCirc.y);
                // line(tokenData.cvW*0.6 + random(1,10), closestCirc.y, tokenData.cvW*0.8, closestCirc.y);

            }
           
            stroke(`#${tmpClr}`);
           
           
                   // drawPoints.push([x,y]);
                  //  line(tokenData.cvW*0.2, y, x, y);
                  //  ellipse(0, 0, 100, 100);
        }
    }
    */

    // noFill();
   
      //attempt shadow - BOOHOO SHADOW TOO SLOW. :(
          /*
      drawingContext.shadowOffsetX = 10;
      drawingContext.shadowOffsetY = 10;
      drawingContext.shadowBlur = random(12,50);
      drawingContext.shadowColor = color(0,0,0,random(10,70));
      */

    

    
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
    image(onTopBuf, 0, 0);
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

            lerpCol = lerpColor(noiseCol, whiteCol, ((map(x+y,stX+stY,wd+ht,0,1) + map(x+y,stX+stY,(tokenData.cvH * tokenData.scale)+(tokenData.cvW * tokenData.scale),0,1))/2) * noiseV*clrEndLvl);
            // lerpCol = lerpColor(noiseCol, whiteCol, (map(x+y,stX+stY,wd+ht,0,1) * noiseV*clrEndLvl));
            gfxBuffer.stroke(lerpCol);
            gfxBuffer.fill(lerpCol);
            gfxBuffer.point(x+0.1,y, 10);
 

            y_off += yincr;
        }
    }
    
}

function newCircle() {
    // let spot = random(drawPoints);
    let si = int(tokenData.ri(0, drawPoints.length));
    let spot = drawPoints[si];
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