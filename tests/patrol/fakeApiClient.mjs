/*
 * Stand-in for the Axios client used by src/api/patrols.js. It records
 * every request and answers with whatever the test asked for.
 */
export const calls = [];

let answer = () => ({ data: {} });

/** Sets the reply for the next requests: `(request) => ({ data })` or throw. */
export function respondWith(reply) {
  answer = reply;
}

/** Clears recorded requests and restores the default empty reply. */
export function resetFakeClient() {
  calls.length = 0;
  answer = () => ({ data: {} });
}

const record =
  (method) =>
  async (url, ...args) => {
    const request = { method, url, args };
    calls.push(request);
    return answer(request);
  };

export default {
  get: record('get'),
  post: record('post'),
  put: record('put'),
  delete: record('delete'),
};
