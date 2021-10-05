// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// index.js - handle testing state controls
//-----------------------------------------------------------------------------

/**
 * Handle speed state change.
 */
const onChangeFlutterAdd = value => {
  tokenState.flutterAdd = parseInt(value);
};

const onChangeLineThickness = value => {
  tokenState.lineThickness = parseInt(value);
};
