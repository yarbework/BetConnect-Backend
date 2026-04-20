
import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';


vi.mock('../utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  },
}));


vi.mock('../models/User.model.js', () => ({
  default: { 
    find: vi.fn(), 
    findByIdAndUpdate: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('../services/emailService.js', () => ({
  sendApprovalEmail: vi.fn(),
}));

import { getPendingAgents, approveAgent } from '../controllers/admin.controller.js';
import User from '../models/User.model.js';
import { sendApprovalEmail } from '../services/emailService.js';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test');
});

beforeEach(async () => {
  vi.clearAllMocks();
});
afterAll(async () => {
  await mongoose.connection.close();
});
function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const fakeAgent = { _id: 'a1', name: 'Agent One', email: 'agent@example.com', role: 'agent', status: 'approved' };

describe('getPendingAgents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of pending agents', async () => {
    const agents = [fakeAgent];
    User.find.mockResolvedValueOnce(agents);
    const res = mockRes();
    await getPendingAgents({}, res, vi.fn());
    expect(User.find).toHaveBeenCalledWith({ role: 'agent', status: 'pending' });
    expect(res.json).toHaveBeenCalledWith(agents);
  });

  it('returns empty array when none', async () => {
    User.find.mockResolvedValueOnce([]);
    const res = mockRes();
    await getPendingAgents({}, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('propagates db errors to next', async () => {
    User.find.mockRejectedValueOnce(new Error('DB fail'));
    const next = vi.fn();
    await getPendingAgents({}, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('approveAgent', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404 when agent not found', async () => {
    User.findByIdAndUpdate.mockResolvedValueOnce(null);
    const res = mockRes();
    await approveAgent({ params: { id: 'bad' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Agent not found' });
  });

  it('updates status to approved', async () => {
    User.findByIdAndUpdate.mockResolvedValueOnce(fakeAgent);
    sendApprovalEmail.mockResolvedValueOnce(true);
    const res = mockRes();
    await approveAgent({ params: { id: 'a1' } }, res, vi.fn());
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith('a1', { status: 'approved' }, { new: true });
    expect(res.json).toHaveBeenCalledWith(fakeAgent);
  });

  it('sends approval email', async () => {
    User.findByIdAndUpdate.mockResolvedValueOnce(fakeAgent);
    sendApprovalEmail.mockResolvedValueOnce(true);
    await approveAgent({ params: { id: 'a1' } }, mockRes(), vi.fn());
    expect(sendApprovalEmail).toHaveBeenCalledWith(fakeAgent.email, fakeAgent.name);
  });

  it('still returns agent even when email throws', async () => {
    User.findByIdAndUpdate.mockResolvedValueOnce(fakeAgent);
    sendApprovalEmail.mockRejectedValueOnce(new Error('SMTP down'));
    const res = mockRes();
    await approveAgent({ params: { id: 'a1' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(fakeAgent);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('propagates db errors to next', async () => {
    User.findByIdAndUpdate.mockRejectedValueOnce(new Error('DB fail'));
    const next = vi.fn();
    await approveAgent({ params: { id: 'a1' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  it('returns the updated agent in response body', async () => {
    User.findByIdAndUpdate.mockResolvedValueOnce(fakeAgent);
    sendApprovalEmail.mockResolvedValueOnce(true);
    const res = mockRes();
    await approveAgent({ params: { id: 'a1' } }, res, vi.fn());
    expect(res.json.mock.calls[0][0]).toMatchObject({ _id: 'a1' });
  });
});
