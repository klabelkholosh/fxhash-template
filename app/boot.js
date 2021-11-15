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
// fltA = flattenAngle, lnThk = lineThickness, fltA = flutterAdd
const tokenState = {
  width: 5,
  lnThk: 0,
  fltA: 0,
  divXSlide: 0,
  fltA: 0,
  moving: true,
  anmC: 0,
  portals: []
};
