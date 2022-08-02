class Circle {

    constructor(x, y, r, clr, buf) {
        this.x = x;
        this.y = y;  
        this.r = r;
        // this.neighbour = neighbour;
        this.growing = true;
        this.fillC = clr;
        this.fillCRand = color(`#${xpPal(random(tokenData.rdPal))}`);
        this.spacer =  tokenData.ri(1,2);
        this.rBzLinA =  tokenData.ri(1,5);
        this.rBzLinB =  tokenData.ri(1,5);
        this.rBzLinC =  tokenData.ri(1,5);
        this.rBzLinWd = tokenData.rn(0, 1);
        this.rBzAlpha =  tokenData.ri(100,255);
        this.shape = round(tokenData.ri(1,3),0); // 1 = solid tri, 2 = lined tri, 3 = square
        this.closestCircArr = [];
        this.buffer = buf;
        this.cubeR = color(`#${xpPal(random(tokenData.rdPal))}`);
        this.cubeG = color(`#${xpPal(random(tokenData.rdPal))}`);
        this.cubeB = color(`#${xpPal(random(tokenData.rdPal))}`);
        this.shapeDrawn = false;
        this.mvmentDrawn = false;
        this.layeredCubes = tokenData.rn(0, 1) > 0.5 ? 1 : 10;
        this.lineNums = tokenData.ri(3,20);
        this.numCircs = tokenData.ri(1,5);
        this.triOnTop = tokenData.rn(0, 1) > 0.5 ? true : false;
        this.divXBy = tokenData.rn(0, 1) > 0.5 ? 1 : 2;
        this.divYBy = this.divXBy === 1 ? 2 : 1;
        this.txtCircGaussBound = tokenData.ri(5,10);
        this.cubeStyle = [];
        for(let lc = 1; lc<=this.layeredCubes; lc++) {
            this.cubeStyle.push(tokenData.rn(0, 1) > 0.5 ? 'spiral' : 'lines');
        }
    }

    show() {
        // console.log('this.fillC: ', this.fillC);
        this.fillC.setAlpha(this.rBzAlpha);
        this.buffer.stroke(this.fillC);

        if(this.rBzLinWd > 0.5) { this.buffer.noFill(); }
        this.buffer.strokeWeight(this.rBzLinWd*2);
        
        for(let p=0; p<this.closestCircArr.length; p++) {
            let el = this.closestCircArr[p];
            drawingContext.setLineDash([0, 0]);
            for(let l=-5; l<10; l=l+2.5) {
                this.buffer.bezier(
                    (this.x * tokenData.scaleW) + l + tokenData.ri(1,10), (this.y * tokenData.scaleH) + l + tokenData.ri(1,10), 
                    (this.x * tokenData.scaleW) + (this.r * ((tokenData.scaleW + tokenData.scaleH)/2)) + l, (this.y * tokenData.scaleH) - (this.r * ((tokenData.scaleW + tokenData.scaleH)/2)) + l, 
                    (el.x * tokenData.scaleW) - (this.r * ((tokenData.scaleW + tokenData.scaleH)/2)) + l + tokenData.ri(1,10), (el.y * tokenData.scaleH) + (this.r * ((tokenData.scaleW + tokenData.scaleH)/2)) + l,
                    (el.x * tokenData.scaleW) + l , (el.y * tokenData.scaleH) + l
                );
            }
        };
    }

    recalcNeighbour(circles) {
        // figure out closest circle in array and send to circle object
        let closestCirc;

        if(circles.length>0) {
            
            closestCirc = circles.filter(c => c.x !== this.x && c.y !== this.y).reduce((a,b) => {                     
                return dist(this.x, this.y, a.x, a.y) <= dist(this.x, this.y, b.x, b.y) ? a : b;
            });
            if(!this.closestCircArr.filter(c => c === closestCirc).length){ // don't add if it already exists...
                this.closestCircArr.push(closestCirc);
            }
            
        } 
    }

    grow() {
        if (this.growing) {
            this.r = this.r + 2;
        } else {
            this.r = this.r - 2;
            if (this.r <= 0) { this.growing = true; }
        }
    }

    edges(winW, winH) {
        return(this.x+this.r > winW || this.x-this.r < 0 || this.y+this.r > winH || this.y-this.r < 0);
    }

    drawCube(xx, yy, c, r, z, buffer, cubeStyle) {

        let x = xx + (c - r) * 50 * sqrt(3) / 2;
        let y = yy + (c + r) * 50 / 2 - (50 * z);
        let loopMax = 20;
        let incr = 2;
        let points = [];
        let smallCube = tokenData.rn(0.75,3); // normally 1
        
        for (let angle = PI / 6; angle < PI * 2; angle += PI / 3) {
            points.push(
                buffer.createVector(x + cos(angle) * (50/smallCube),
                y + sin(angle) * (50/smallCube)));
        }
        
        buffer.noFill();
        buffer.strokeWeight(tokenData.ri(1,2));
        
        // scale our more re-used coords correctly, for drawing things
        let scX = (x * tokenData.scaleW);
        let scY = (y * tokenData.scaleH);
        let scP0y = (points[0].y * tokenData.scaleH);
        let scP2y = (points[2].y * tokenData.scaleH);
        let scP3x = (points[3].x * tokenData.scaleW);
        let scP3y = (points[3].y * tokenData.scaleH);
        let scP4x = (points[4].x * tokenData.scaleW);
        let scP4y = (points[4].y * tokenData.scaleH);
        let scP5x = (points[5].x * tokenData.scaleW);
        let scP5y = (points[5].y * tokenData.scaleH);

        // line style
        if(cubeStyle === 'lines') {
           
            let topBzFact = (tokenData.ri(1,3)*(this.lineNums/smallCube));
            let yDist1;
            let yDist2;
            let xDist1 = (x - points[3].x) / this.lineNums;
            let xDist2 = (points[5].x - points[4].x) / this.lineNums;
            for(let l=1; l<=this.lineNums; l++) {

                buffer.stroke(this.cubeR);
                yDist1 = (points[1].y - y) / this.lineNums;
                yDist2 = (points[0].y - points[5].y) / this.lineNums;
                // right face normal 3 lines
                buffer.bezier(
                    scX , scY + ((yDist1 * tokenData.scaleH) * l) ,
                    scX , scY + ((yDist1 * tokenData.scaleH) * l) ,
                    scP5x , scP5y + ((yDist2 * tokenData.scaleH) * l) ,
                    scP5x , scP5y + ((yDist2 * tokenData.scaleH) * l)
                )

                buffer.stroke(this.cubeG);
                // left edge normal 3 lines
                buffer.bezier(
                    scX , scY + ((yDist1 * tokenData.scaleH) * l) ,
                    scX , scY + ((yDist1 * tokenData.scaleH) * l) ,
                    scP3x, scP3y + ((yDist2 * tokenData.scaleH) * l) ,
                    scP3x, scP3y + ((yDist2 * tokenData.scaleH) * l) 
                )

                buffer.stroke(this.cubeB);
                yDist1 = (y - points[3].y) / this.lineNums;
                yDist2 = (points[5].y - points[4].y) / this.lineNums;
                // top face normal 3 lines
                buffer.bezier(
                    scP3x + ((xDist1 * tokenData.scaleW) * l) , scP3y + ((yDist1 * tokenData.scaleH) * l),
                    scP3x + ((xDist1 * tokenData.scaleW) * l) , scP3y + ((yDist1 * tokenData.scaleH) * l) - (topBzFact * tokenData.scaleH),
                    scP4x + ((xDist2 * tokenData.scaleW) * l) , scP4y + ((yDist2 * tokenData.scaleH) * l) - (topBzFact * tokenData.scaleH),
                    scP4x + ((xDist2 * tokenData.scaleW) * l) , scP4y + ((yDist2 * tokenData.scaleH) * l) - (topBzFact * tokenData.scaleH)
                )
            }
            
        // spiral style
        } else {

            loopMax = loopMax / smallCube;

            // right face
            buffer.stroke(this.cubeR);
            buffer.beginShape();
            for(let l=0; l<loopMax; l += incr) {
                buffer.vertex(scX+l, scY+l);
                buffer.vertex(scP5x-l, scP5y+(l*((2.25 * tokenData.scaleH)/smallCube)));
                buffer.vertex(scP5x-l, scP0y-l);
                if(l<loopMax){ buffer.vertex(scX+(l+incr), (scY+(scP0y - scP5y))-(l*((2.25 * tokenData.scaleH)/smallCube))); }
            }
            buffer.endShape();
    
    
            // left face
            buffer.stroke(this.cubeG);
            buffer.beginShape();
            for(let l=0; l<loopMax; l += incr) {
                buffer.vertex(scX-l, scY+l);
                buffer.vertex(scP3x+l, scP3y+(l*((2.25 * tokenData.scaleH)/smallCube)));
                buffer.vertex(scP3x+l, scP2y-l);
                if(l<loopMax){ buffer.vertex(scX-(l+incr), (scY+(scP2y - scP3y))-(l*((2.25 * tokenData.scaleH)/smallCube))); }
            }
            buffer.endShape();

            // top face
            buffer.stroke(this.cubeB);
            buffer.beginShape();
            for(let l=0; l<loopMax; l += incr) {
                buffer.vertex(scX, scY-(l*((1.25 * tokenData.scaleH)/smallCube)));
                buffer.vertex(scP5x-(l*((2.5 * tokenData.scaleW)/smallCube)), scP5y);
                buffer.vertex(scX, scP4y+(l*((1.25 * tokenData.scaleH)/smallCube)));
                buffer.vertex(scP3x+(l*((2.5 * tokenData.scaleW)/smallCube))+(incr), scP5y-(incr));
                // buffer.vertex(points[3].x+((l*(incr))/(loopMax*0.25)), points[3].y-(incr/2));
                //if(l<loopMax*1.25){ buffer.vertex(points[3].x+(l*1.75), points[3].y); }
            }
            buffer.endShape();
        }
     
        
        
    }

    // those grainy circle lines that run across triangles and other areas
    drawMovementLines(buffer, winW, winH) {

        if(this.mvmentDrawn === false) {

            if(this.closestCircArr.length > 3) {
                let c = this.closestCircArr;
                let cntrTriX = (c[0].x + c[1].x + c[2].x)/3;
                let cntrTriY = (c[0].y + c[1].y + c[2].y)/3;

                // movement line
                let lineClr = color(`#${xpPal(random(tokenData.rdPal))}`);
                lineClr = this.fillCRand;
                lineClr.setAlpha(255);

                // do circles (or weird shape) along line from center of triangle to a point
                for(let cc=0; cc<this.numCircs; cc++) {
                    // buffer.point(lerpX1, lerpY1, dist(c[0].x, c[0].y, cntrTriX, cntrTriY)/this.numCircs);
                    buffer.fill(lineClr);
                    for(let cd=0; cd<c.length; cd++) {
                        drawTxtrCirc(
                            (lerp(cntrTriX, c[cd].x, map(cc, 0, this.numCircs, 0, 1)) * tokenData.scaleW), 
                            (lerp(cntrTriY, c[cd].y, map(cc, 0, this.numCircs, 0, 1)) * tokenData.scaleH), 
                            ((dist(c[cd].x, c[cd].y, cntrTriX, cntrTriY)/this.numCircs)/this.divXBy * tokenData.scaleH),
                            ((dist(c[cd].x, c[cd].y, cntrTriX, cntrTriY)/this.numCircs)/this.divYBy * tokenData.scaleH), 
                            tokenData.rn(0.5, this.txtCircGaussBound), 
                            lineClr, 
                            buffer,
                            winW,
                            winH
                        );
                    }
                }
            }
            this.mvmentDrawn = true;
        }
    }

    drawTriangles(buffer, winW, winH) {
        if(this.shapeDrawn === false) {
       
            if(this.closestCircArr.length > 3) {
                
                let c = this.closestCircArr;

                // solid triangle
                if(this.shape === 1) {
                    
                    buffer.noStroke();

                    // shadow triangle
                    let dullClr = lerpColor(this.fillC, color('black'), 0.5)
                    dullClr.setAlpha(100);
                    buffer.fill(dullClr);
                    buffer.triangle(
                        (c[0].x * tokenData.scaleW),
                        (c[0].y * tokenData.scaleH),
                        (c[1].x * tokenData.scaleW) + (10 * tokenData.scaleW),
                        (c[1].y * tokenData.scaleH) + (10 * tokenData.scaleH),
                        (c[2].x * tokenData.scaleW) + (10 * tokenData.scaleW),
                        (c[2].y * tokenData.scaleH) + (10 * tokenData.scaleH),
                    );
                    
                    // main triangle
                    let testClr = this.fillC;
                    buffer.fill(testClr);
                    
                    drawTxtrTri(
                        (c[0].x * tokenData.scaleW),
                        (c[0].y * tokenData.scaleH),
                        (c[1].x * tokenData.scaleW),
                        (c[1].y * tokenData.scaleH),
                        (c[2].x * tokenData.scaleW),
                        (c[2].y * tokenData.scaleH)
                        ,testClr
                        ,buffer
                        ,winW
                        ,winH
                    );
                    
                    // draw random lines across triangle surface
                    for(let tr=0; tr<20; tr++) {
                        let tClr = color(`#${xpPal(random(tokenData.rdPal))}`);
                        tClr.setAlpha(100);
                        buffer.stroke(tClr);
                        buffer.strokeWeight(tokenData.rn(0.1,0.5));
                        setLineDash([tokenData.ri(1,10), tokenData.ri(1,10)], buffer);
                        let randLerp1 = tokenData.rn(0, 1);
                        let randLerp2 = tokenData.rn(0, 1);
                        let lerpX1 = lerp(c[0].x, c[1].x, randLerp1);
                        let lerpY1 = lerp(c[0].y, c[1].y, randLerp1);
                        let lerpX2 = lerp(c[1].x, c[2].x, randLerp2);
                        let lerpY2 = lerp(c[1].y, c[2].y, randLerp2);
                        buffer.line(
                            (lerpX1 * tokenData.scaleW), 
                            (lerpY1 * tokenData.scaleH), 
                            (lerpX2 * tokenData.scaleW), 
                            (lerpY2 * tokenData.scaleH)
                        );
                    }
                    setLineDash([], buffer);
                    
                    
                // lined triangle
                } else if(this.shape === 2) {
                    // fill triangle shape with lines across two of the sides..
                    let lineNums = tokenData.ri(100, 300); // how many lines will we be drawing?

                    // figure out distance and scale to lines needed inside triangle
                    let xdist1 = (c[1].x - c[0].x) / lineNums; // x distance between first and second point
                    let xdist2 = (c[2].x - c[0].x) / lineNums; // x distance between first and third point
                    let ydist1 = (c[1].y - c[0].y) / lineNums; // y distance between first and second point
                    let ydist2 = (c[2].y - c[0].y) / lineNums; // y distance between first and third point

                    // for as many lines as we need, fill with lines or squares...
                     // line shadow
                    for(let l=1; l<=lineNums; l++){
                        buffer.strokeWeight(tokenData.rn(0.1,this.r/5));
                        let dullClr = lerpColor(this.fillC, color('black'), 0.5)
                        dullClr.setAlpha(100);
                        buffer.stroke(dullClr);
                        buffer.line(
                            (c[0].x * tokenData.scaleW) + ((xdist1 * tokenData.scaleW) *l) + tokenData.ri(1,5) + (5 * tokenData.scaleW),
                            (c[0].y * tokenData.scaleH) + ((ydist1 * tokenData.scaleH) *l) + tokenData.ri(1,5) + (10 * tokenData.scaleH),
                            (c[0].x * tokenData.scaleW) + ((xdist2 * tokenData.scaleW) *l) + tokenData.ri(1,5) + (5 * tokenData.scaleW),
                            (c[0].y * tokenData.scaleH) + ((ydist2 * tokenData.scaleH) *l) + tokenData.ri(1,5) + (10 * tokenData.scaleH),
                        );
                    }
                    // actual line
                    for(let l=1; l<=lineNums; l++){

                        let inter = map(l, 1, lineNums, 0, 1);
                        let lerC = lerpColor(this.fillC, this.fillCRand, inter);

                        lerC.setAlpha(255);
                        buffer.strokeWeight(tokenData.ri(1,2));
                        buffer.stroke(lerC);
                        buffer.line(
                            (c[0].x * tokenData.scaleW) + ((xdist1 * tokenData.scaleW) *l) + tokenData.ri(1,5),
                            (c[0].y * tokenData.scaleH) + ((ydist1 * tokenData.scaleH) *l) + tokenData.ri(1,5),
                            (c[0].x * tokenData.scaleW) + ((xdist2 * tokenData.scaleW) *l) + tokenData.ri(1,5),
                            (c[0].y * tokenData.scaleH) + ((ydist2 * tokenData.scaleH) *l) + tokenData.ri(1,5),
                        );
                    }
                    
                // draw a 'cube'-type shape (or layered cube)
                } else if(this.shape === 3) {

                    for(let l=1; l<= this.layeredCubes; l++){
                        buffer.strokeWeight(tokenData.rn(0, 1)); // thin between 0.1 and 1
                        this.drawCube(
                            c[0].x, c[0].y,
                            1, 1, 1, buffer, this.cubeStyle[l]
                        );
                    }
                    
                }
                this.shapeDrawn = true;
            }
        }
    }
}