// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// boot.js - bootstrap script with global data
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// testing
//-----------------------------------------------------------------------------

const randomHash = size => {
  const digits = "0123456789abcdef";
  return '0x' + [...Array(size).keys()]
    .map(() => digits[Math.floor(Math.random() * digits.length)])
    .join('');
};

//-----------------------------------------------------------------------------
// globals
//-----------------------------------------------------------------------------

const tokenData = {
  projectId: 1,
  tokenId: 1,
  hash: randomHash(64)
};

//-----------------------------------------------------------------------------

const tokenState = {
  width: 5,
  lineThickness: 0,
  flutterAdd: 0,
  divXSlide: 0,
  flattenAng: 0,
  moving: true,
  animCounter: 0,
  portals: []
};
