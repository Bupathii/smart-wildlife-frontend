/*
 * Node module-resolution hook (see register.mjs). When src/api/patrols.js
 * imports './client', it receives tests/patrol/fakeApiClient.mjs instead.
 * Every other import resolves normally.
 */
const FAKE_CLIENT_URL = new URL('./fakeApiClient.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  const fromPatrolApi = context.parentURL?.endsWith('/src/api/patrols.js');
  if (fromPatrolApi && specifier === './client') {
    return { url: FAKE_CLIENT_URL, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
