#fxhash template

- a badly written fxhash template

## Installation

'npm install' should work
use 'make' in the script root directory to build the script
(if 'make' doesn't work, try 'source .env && make')

## Customize

.. it currently draws a crappy square.. the background color and color of the square are random, from a hash generated by the 'fxhash' function.. this is bare bones
to illustrate how the whole thing works!

- to customize, basically replace my crappy square with your art script stuff in art.js, where indicated
  then run 'make', and if it succeeds, open your browser to '{Place you put this code}/fxhash-template/app/index.html' to see the results

## Using on fxhash.com

..then to use on fxhash site:
_ make sure you've run 'make' to build the script
_ you zip up the contents of /app (it should be 4 files, art-concat.js, index.css, index.html and p5-blabla.js) \* go to fxhash's sandbox and drag zip there to test it
