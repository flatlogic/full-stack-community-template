export const resetNotify = (state) => {
  state.notify.showNotification = false;
  state.notify.typeNotification = '';
  state.notify.textNotification = '';
};
export const rejectNotify = (state, action) => {
  if (typeof action.payload === 'string') {
    state.notify.textNotification = action.payload;
  } else if (typeof action === 'object') {
    const obj = { ...action.payload?.errors };
    delete obj['_errors'];

    let msg = '';

    for (const key in obj) {
      msg += `${key}: ${obj[key]['_errors']}; \n `;
    }

    state.notify.textNotification = msg;
  } else {
    state.notify.textNotification = 'Network error';
  }
  state.notify.textNotification = state.notify.textNotification || 'Network error';
  state.notify.typeNotification = 'error';
  state.notify.showNotification = true;
};
export const fulfilledNotify = (state, msg) => {
  state.notify.textNotification = msg;
  state.notify.typeNotification = 'success';
  state.notify.showNotification = true;
};
