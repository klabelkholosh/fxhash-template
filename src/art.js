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