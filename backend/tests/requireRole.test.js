const requireRole = require('../src/middleware/requireRole');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('requireRole middleware', () => {
  test('izin verilen rol → next() çağrılır', () => {
    const next = jest.fn();
    const res = mockRes();
    requireRole('parent', 'specialist')({ user: { role: 'parent' } }, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('izin verilmeyen rol → 403', () => {
    const next = jest.fn();
    const res = mockRes();
    requireRole('parent')({ user: { role: 'child' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('req.user yoksa → 401', () => {
    const next = jest.fn();
    const res = mockRes();
    requireRole('parent')({}, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
