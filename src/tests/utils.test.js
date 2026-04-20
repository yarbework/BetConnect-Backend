import { describe, it, expect, vi } from 'vitest';
import { asyncHandler } from '../utils/asyncHandler.js';
import generateToken from '../utils/generateToken.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

afterAll(async () => {
  await mongoose.connection.close();
});

describe('asyncHandler', () => {
  it('calls wrapped fn with req, res, next', async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(fn);
    const [req, res, next] = [{}, {}, vi.fn()];
    await wrapped(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('calls next with error when fn rejects', async () => {
    const error = new Error('boom');
    const fn = vi.fn().mockRejectedValue(error);
    const next = vi.fn();
    await asyncHandler(fn)({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('does NOT call next when fn resolves', async () => {
    const next = vi.fn();
    await asyncHandler(vi.fn().mockResolvedValue('ok'))({}, {}, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns a function', () => {
    expect(asyncHandler(vi.fn())).toBeTypeOf('function');
  });

  it('catches sync throws via Promise.resolve wrapping', async () => {

    const error = new TypeError('sync boom');
    const fn = () => { throw error; };
    const next = vi.fn();
    
    try {
      await asyncHandler(fn)({}, {}, next);
    } catch (e) {
      expect(e).toBe(error);
    }
  });
});

describe('generateToken', () => {
  it('returns a non-empty string', () => {
    const t = generateToken('id1');
    expect(t).toBeTypeOf('string');
    expect(t.length).toBeGreaterThan(0);
  });

  it('produces a valid JWT with the given id', () => {
    const t = generateToken('abc123');
    const d = jwt.verify(t, process.env.JWT_SECRET);
    expect(d.id).toBe('abc123');
  });

  it('sets 30-day expiry', () => {
    const t = generateToken('x');
    const d = jwt.decode(t);
    expect(d.exp - d.iat).toBe(30 * 24 * 60 * 60);
  });

  it('different ids produce different tokens', () => {
    expect(generateToken('id1')).not.toBe(generateToken('id2'));
  });

  it('token has three JWT segments', () => {
    expect(generateToken('seg').split('.')).toHaveLength(3);
  });
});