import { handleApi } from '../_lib/router.js';

export function GET(request: Request) {
  return handleApi(request);
}
