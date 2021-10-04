// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// index.js - handle testing state controls
//-----------------------------------------------------------------------------

/**
 * Handle speed state change.
 */
const onChangeDivXSlide = value => {
  tokenState.divXSlide = parseInt(value);
};

const onChangeFlattenAng = value => {
  tokenState.flattenAng = parseInt(value);
};

const onChangeFrameRate = value => {
  tokenState.frameRate = parseInt(value);
};

const onChangeFlutterAdd = value => {
  tokenState.flutterAdd = parseInt(value);
};

const onChangeLineThickness = value => {
  tokenState.lineThickness = parseInt(value);
};
