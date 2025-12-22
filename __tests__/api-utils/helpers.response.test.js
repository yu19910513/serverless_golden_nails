import { respond } from '../../api/_utils/helpers/response.js';
import { createMockRes } from '../../test-support/_testUtils.js';

describe('helpers/response.respond', () => {
  test('ok', () => {
    const res = createMockRes();
    const data = { a: 1 };
    respond.ok(res, data);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(data);
  });
  test('created', () => {
    const res = createMockRes();
    respond.created(res, { id: 1 });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1 });
  });
  test('badRequest/unauthorized/forbidden/notFound/conflict/serverError/methodNotAllowed', () => {
    const res = createMockRes();
    respond.badRequest(res, 'x');
    respond.unauthorized(res, 'y');
    respond.forbidden(res, 'z');
    respond.notFound(res, 'n');
    respond.conflict(res, 'c');
    respond.serverError(res, 's');
    respond.methodNotAllowed(res, 'PUT');

    expect(res.status).toHaveBeenNthCalledWith(1, 400);
    expect(res.json).toHaveBeenNthCalledWith(1, { error: 'x' });
    expect(res.status).toHaveBeenNthCalledWith(2, 401);
    expect(res.status).toHaveBeenNthCalledWith(3, 403);
    expect(res.status).toHaveBeenNthCalledWith(4, 404);
    expect(res.status).toHaveBeenNthCalledWith(5, 409);
    expect(res.status).toHaveBeenNthCalledWith(6, 500);
    expect(res.status).toHaveBeenNthCalledWith(7, 405);
  });
});
