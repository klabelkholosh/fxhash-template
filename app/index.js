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

const onChangeFltA = value => {
  tokenState.fltA = parseInt(value);
};

const onChangeLnThk = value => {
  tokenState.lnThk = parseInt(value);
};
