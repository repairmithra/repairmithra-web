import test from 'node:test';
import assert from 'node:assert/strict';
import requireRole from '../src/middleware/requireRole.js';

const buildReq = (role = 'customer') => ({ user: { role } });

const buildRes = () => {
  const res = {
    statusCode: 200,
    jsonPayload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonPayload = payload;
      return this;
    },
  };

  return res;
};

test('customer role is allowed for customer route', () => {
  const req = buildReq('customer');
  const res = buildRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  requireRole('customer')(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});

test('non-customer role is denied for customer route', () => {
  const req = buildReq('admin');
  const res = buildRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  requireRole('customer')(req, res, next);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.jsonPayload.success, false);
});

test('missing user is denied auth check', () => {
  const req = {};
  const res = buildRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  requireRole('customer')(req, res, next);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('role helper accepts multiple allowed roles', () => {
  const req = buildReq('admin');
  const res = buildRes();
  let nextCalled = false;
  const next = () => { nextCalled = true; };

  requireRole('customer', 'admin')(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});
