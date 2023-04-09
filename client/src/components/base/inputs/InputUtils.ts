import React from "react";

/**
 * Wraps an input's onKeyDown event and calls "callback" if enter was pressed. If the event was a keyboard event and was
 * "Enter", then the event is also prevented.
 * @param callback a callback that will be triggered if enter is pressed.
 */
export const onEnter = (callback: (e: React.KeyboardEvent<HTMLDivElement | HTMLInputElement>) => void | Promise<void>) => (e: React.SyntheticEvent<HTMLDivElement | HTMLInputElement>) => {
  if (!('keyCode' in e)) {
    return;
  }
  const keyboardEvent = e as React.KeyboardEvent<HTMLDivElement | HTMLInputElement>;
  if (keyboardEvent.key === 'Enter') {
    keyboardEvent.preventDefault();
    return callback(keyboardEvent);
  }
}
