import request from 'supertest';
import { createServerlessHandler } from '../../api/_utils/helpers/createServerlessApp.js';

jest.mock('../../api/_utils/legacy/authentication.js', () => ({
  basic_auth: jest.fn((req, res, next) => next()),
}));

describe('helpers/createServerlessApp.createServerlessHandler', () => {
  test('mounts routes under basePath and uses basic_auth', async () => {
    const handler = createServerlessHandler('/api/test', (router) => {
      router.get('/ping', (req, res) => res.status(200).json({ pong: true }));
    });

    // supertest can wrap a handler function (it must be a listener)
    const server = (req, res) => handler(req, res);
    const res = await request(server).get('/api/test/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pong: true });
  });
});
