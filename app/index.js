// vim: ts=2:sw=2
//-----------------------------------------------------------------------------
// index.js - handle testing state controls
//-----------------------------------------------------------------------------

/**
 * Handle paused, flutter and line thickness state change.
 */

const onChangeMoving = checked => {
  tokenState.moving = checked;
};

const onChangeFlutterAdd = value => {
  tokenState.flutterAdd = parseInt(value);
};

const onChangeLineThickness = value => {
  tokenState.lineThickness = parseInt(value);
};
