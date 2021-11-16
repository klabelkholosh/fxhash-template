// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// metadata.js - convert traits into compatible metadata
//-----------------------------------------------------------------------------

const hashToMetadata = (hash, state) => {

  let {
    seed,
    rotCh,
    divNum,
    pNum,
    chBGc,
    slA,
    stWt,
    cvCh,
    rndDy
  } = hashToTraits(hash);

  //
  // Note traits returned as strings / numbers / bools are all treated slightly
  //  differently by OpenSea.
  //
  // Please refer to their documentation:
  //   https://docs.opensea.io/docs/metadata-standards
  //

  return [{
    trait_type: "divisions",
    value: divNum
  }, {
    trait_type: "paletteFamily",
    value: getPName(pNum)
  }, {
    trait_type: "uncutStyle",
    value: slA > 0 ? 'lifted' : 'flat',
  }, { 
    trait_type: "bgStyle",
    value: chBGc < 8 ? "harmonious" : "chaos",
  }, {
    trait_type: "strokeWeight",
    value: stWt,
  }, {
    trait_type: "rotation",
    value: rotCh ? 'ascending' : 'normal',
  }, {
    trait_type: "lineStyle",
    value: cvCh ? 'curved' : 'straight',
  }, {
    trait_type: "liftingOn",
    value: rndDy.getDate() + '-' + rndDy.getMonth(),
  }];

};
