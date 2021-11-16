// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// metadata.js - convert traits into compatible metadata
//-----------------------------------------------------------------------------

const hashToMetadata = (hash, state) => {

  let {
    seed,
    rotCh,
    divNum,
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
    trait_type: "Divisions",
    value: divNum
  }, {
    trait_type: "UncutStyle",
    value: slA > 0 ? 'Lifted' : 'Flat',
  }, { 
    trait_type: "BackgroundStyle",
    value: chBGc < 8 ? "Harmonious" : "Random",
  }, {
    trait_type: "InitialStrokeWeight",
    value: stWt,
  }, {
    trait_type: "Rotation",
    value: rotCh ? 'Ascending' : 'Normal',
  }, {
    trait_type: "LineStyle",
    value: cvCh ? 'Curved' : 'Straight',
  }, {
    trait_type: "LiftingOn",
    value: rndDy.getDate() + '-' + rndDy.getMonth(),
  }];

};
