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

const onMouseDwnSlider = value => {
  if(!document.getElementById('moving').checked) {
    tokenState.moving = true;
  }
};

const onMouseUpSlider = value => {
  if(!document.getElementById('moving').checked) {
    tokenState.moving = false;
  }
};
