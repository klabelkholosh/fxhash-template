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

const onChangeFlutA = value => {
  tokenState.flutA = parseInt(value);
};

const onChangeLnThk = value => {
  tokenState.lnThk = parseInt(value);
};
