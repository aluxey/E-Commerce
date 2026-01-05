export let listeners = [];
let counter = 0;

export const pushToast = (payload) => {
  const id = ++counter;
  const toast = { id, ...payload };
  listeners.forEach(fn => fn(toast));
  return id;
};