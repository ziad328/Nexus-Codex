import axios, { CanceledError } from 'axios';

// Our own proxy (api/), which holds the IGDB keys. The browser never sees a key.
export default axios.create({ baseURL: '/api' });

export { CanceledError };
