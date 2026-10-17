/*
 * Loaded with `node --import` before the patrol tests. It swaps the real
 * Axios client (src/api/client.js) for a fake one, so the API functions can
 * be tested without a server, a browser or extra npm packages.
 */
import { register } from 'node:module';

register('./hooks.mjs', import.meta.url);
