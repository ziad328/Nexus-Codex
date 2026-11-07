import axios from 'axios';
import apiClient, { CanceledError } from '../../src/services/api-client';
import { apiRequests, mockApi } from '../fakes/network';

describe('api-client', () => {
  it('talks only to our own proxy', () => {
    expect(apiClient.defaults.baseURL).toBe('/api');
  });

  it('sends no key from the browser', async () => {
    mockApi('/games', {});

    await apiClient.get('/games', { params: { page: 2 } });

    expect(apiRequests[0].params).toEqual({ page: 2 });
  });

  it('exports the error type Axios throws when a request is aborted', () => {
    expect(CanceledError).toBe(axios.CanceledError);
  });
});
