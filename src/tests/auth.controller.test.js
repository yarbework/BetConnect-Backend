import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';


vi.mock('../utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  },
}));


vi.mock('../utils/generateToken.js', () => ({
  default: vi.fn().mockReturnValue('mock-jwt-token'),
}));


vi.mock('../models/User.model.js', () => ({
  default: { 
    create: vi.fn(), 
    findOne: vi.fn(),
  },
}));


import { register, login } from '../controllers/auth.controller.js';
import User from '../models/User.model.js';
import generateToken from '../utils/generateToken.js';


beforeAll(async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/betconnect_test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
}, 30000);

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}, 30000);
function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const baseUser = { _id: 'uid1', name: 'Yohannes', email: 'y@test.com', phone: '0911', role: 'user', status: 'approved' };

describe('register controller', () => {
  beforeEach(() => vi.clearAllMocks());

 it('400 when required fields are missing', async () => {
  
  const res = mockRes();
  await register({ body: { name: 'Jo' } }, res, vi.fn());
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ message: 'Please insert all the required fields' });
});

  it('400 when personalAddress missing', async () => {
    const res = mockRes();
    await register({ body: { name: 'Jo', email: 'j@j.com', phone: '09', password: 'p', role: 'user' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('400 when email already exists', async () => {
    User.findOne.mockResolvedValueOnce(baseUser);
    const res = mockRes();
    await register({ body: { name: 'Jo', email: 'y@test.com', phone: '09', password: 'p', role: 'user', personalAddress: 'Bole' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'User already exists' });
  });

  it('201 and token for new user', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({ ...baseUser, role: 'user', status: 'approved' });
    const res = mockRes();
    await register({ body: { name: 'Jo', email: 'new@t.com', phone: '09', password: 'p', role: 'user', personalAddress: 'B' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].token).toBe('mock-jwt-token');
  });

  it('agent gets pending status', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({ ...baseUser, role: 'agent', status: 'pending' });
    const res = mockRes();
    await register({ body: { name: 'Ag', email: 'ag@t.com', phone: '09', password: 'p', role: 'agent', personalAddress: 'AA' } }, res, vi.fn());
    expect(res.json.mock.calls[0][0].status).toBe('pending');
  });

  it('400 when User.create returns falsy', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce(null);
    const res = mockRes();
    await register({ body: { name: 'Jo', email: 'n@t.com', phone: '09', password: 'p', role: 'user', personalAddress: 'B' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid user data' });
  });

  it('coerces admin role to user', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({ ...baseUser, role: 'user', status: 'approved' });
    await register({ body: { name: 'Jo', email: 'n2@t.com', phone: '09', password: 'p', role: 'admin', personalAddress: 'B' } }, mockRes(), vi.fn());
    expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'user' }));
  });

  it('response has required fields', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce(baseUser);
    const res = mockRes();
    await register({ body: { name: 'Jo', email: 'n3@t.com', phone: '09', password: 'p', role: 'user', personalAddress: 'B' } }, res, vi.fn());
    const p = res.json.mock.calls[0][0];
    ['_id','name','email','role','status','token'].forEach(k => expect(p).toHaveProperty(k));
  });

  it('propagates db errors to next', async () => {
    User.findOne.mockRejectedValueOnce(new Error('DB crash'));
    const next = vi.fn();
    await register({ body: { name: 'J', email: 'j@j.com', phone: '0900', password: 'p', role: 'user', personalAddress: 'X' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('login controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401 when user not found', async () => {
    User.findOne.mockResolvedValueOnce(null);
    const res = mockRes();
    await login({ body: { email: 'no@one.com', password: 'x' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or Password' });
  });

  it('401 when password wrong', async () => {
    User.findOne.mockResolvedValueOnce({ ...baseUser, matchPassword: vi.fn().mockResolvedValueOnce(false) });
    const res = mockRes();
    await login({ body: { email: 'y@test.com', password: 'bad' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('200 with user data and token on success', async () => {
    User.findOne.mockResolvedValueOnce({ ...baseUser, matchPassword: vi.fn().mockResolvedValueOnce(true) });
    const res = mockRes();
    await login({ body: { email: 'y@test.com', password: 'good' } }, res, vi.fn());
    expect(res.status).not.toHaveBeenCalled();
    const p = res.json.mock.calls[0][0];
    expect(p.email).toBe(baseUser.email);
    expect(p.token).toBe('mock-jwt-token');
  });

  it('calls matchPassword with supplied password', async () => {
    const u = { ...baseUser, matchPassword: vi.fn().mockResolvedValueOnce(true) };
    User.findOne.mockResolvedValueOnce(u);
    await login({ body: { email: 'y@test.com', password: 'mypass' } }, mockRes(), vi.fn());
    expect(u.matchPassword).toHaveBeenCalledWith('mypass');
  });

  it('response has no password field', async () => {
    User.findOne.mockResolvedValueOnce({ ...baseUser, password: 'hash', matchPassword: vi.fn().mockResolvedValueOnce(true) });
    const res = mockRes();
    await login({ body: { email: 'y@test.com', password: 'p' } }, res, vi.fn());
    expect(res.json.mock.calls[0][0]).not.toHaveProperty('password');
  });

  it('calls generateToken with user _id', async () => {
    User.findOne.mockResolvedValueOnce({ ...baseUser, matchPassword: vi.fn().mockResolvedValueOnce(true) });
    await login({ body: { email: 'y@test.com', password: 'p' } }, mockRes(), vi.fn());
    expect(generateToken).toHaveBeenCalledWith(baseUser._id);
  });

  it('propagates db errors to next', async () => {
    User.findOne.mockRejectedValueOnce(new Error('DB crash'));
    const next = vi.fn();
    await login({ body: { email: 'x@x.com', password: 'p' } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});