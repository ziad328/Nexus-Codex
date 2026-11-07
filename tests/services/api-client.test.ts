import axios from 'axios';
import apiClient, { CanceledError } from '../../src/services/api-client';
import { apiRequests, mockApi } from '../fakes/network';

describe('api-client', () => {
  it('points at RAWG', () => {
    expect(apiClient.defaults.baseURL).toBe('https://api.rawg.io/api');
  });

  it('sends the API key with every request, alongside other params', async () => {
    mockApi('/games', {});

    await apiClient.get('/games', { params: { page: 2 } });

    expect(apiRequests[0].params).toEqual({ key: 'test-rawg-key', page: 2 });
  });

  it('exports the error type Axios throws when a request is aborted', () => {
    expect(CanceledError).toBe(axios.CanceledError);
  });
});
