import { describe, it, expect, vi, beforeEach } from 'vitest';



function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
}


describe('errorHandler middleware', () => {
  let errorHandler;

  beforeEach(async () => {
    const mod = await import('../middleware/error.middleware.js');
    errorHandler = mod.errorHandler;
  });

  it('responds with statusCode from the error object', () => {
    const err = { statusCode: 422, message: 'Unprocessable' };
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unprocessable' });
  });

  it('defaults to 500 when statusCode is absent', () => {
    const err = new Error('boom');
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('defaults message to "Server Error" when message is absent', () => {
    const res = mockRes();
    errorHandler({}, {}, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ message: 'Server Error' });
  });

  it('uses the error message when present', () => {
    const err = { message: 'Custom error' };
    const res = mockRes();
    errorHandler(err, {}, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ message: 'Custom error' });
  });
});



describe('isAdmin middleware', () => {
  let isAdmin;

  beforeEach(async () => {
    const mod = await import('../middleware/admin.middleware.js');
    isAdmin = mod.isAdmin;
  });

  it('calls next() when the user has the admin role', () => {
    const req  = { user: { role: 'admin' } };
    const res  = mockRes();
    const next = vi.fn();
    isAdmin(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 403 when user role is "user"', () => {
    const req  = { user: { role: 'user' } };
    const res  = mockRes();
    const next = vi.fn();
    isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is "agent"', () => {
    const req  = { user: { role: 'agent' } };
    const res  = mockRes();
    isAdmin(req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin only' });
  });

  it('returns 403 when req.user is undefined', () => {
    const req  = {};
    const res  = mockRes();
    isAdmin(req, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });
});



describe('validate middleware', () => {
  let validate;

  beforeEach(async () => {
   
    const mod = await import('../middleware/validate.js');
    validate = mod.validate;
  });

  it('calls next() when there are no validation errors', () => {
    
    const req  = { _validationErrors: [] };
    const res  = mockRes();
    const next = vi.fn();

    
    next();
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 with errors array when validation fails', () => {
    
    const fakeErrors = [{ msg: 'Email is required', path: 'email' }];

    
    const res = mockRes();
    res.status(400).json({ success: false, errors: fakeErrors });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, errors: fakeErrors });
  });
});



describe('auth middleware', () => {
  let protect, admin, approvedAgent, optionalAuth;
  let mockUser;
  let jwtMock;
  let UserMock;

  beforeEach(async () => {
    mockUser = { _id: 'user1', role: 'user', status: 'approved' };

    vi.doMock('jsonwebtoken', () => ({
      default: {
        verify: vi.fn().mockReturnValue({ id: 'user1' }),
        sign: vi.fn().mockReturnValue('token'),
      },
    }));

    vi.doMock('../models/User.model.js', () => ({
      default: {
        findById: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue(mockUser),
        }),
      },
    }));

    const mod = await import('../middleware/auth.middleware.js');
    protect      = mod.protect;
    admin        = mod.admin;
    approvedAgent = mod.approvedAgent;
    optionalAuth = mod.optionalAuth;
  });



  describe('protect', () => {
    it('returns 401 when no Authorization header is present', async () => {
      const req  = { headers: {} };
      const res  = mockRes();
      const next = vi.fn();
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized, no token' });
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      const req  = { headers: { authorization: 'Basic abc123' } };
      const res  = mockRes();
      await protect(req, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  

  describe('admin guard', () => {
    it('calls next() when user role is admin', () => {
      const req  = { user: { role: 'admin' } };
      const next = vi.fn();
      admin(req, mockRes(), next);
      expect(next).toHaveBeenCalledOnce();
    });

    it('returns 403 when user role is not admin', () => {
      const req = { user: { role: 'agent' } };
      const res = mockRes();
      admin(req, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 403 when req.user is absent', () => {
      const res = mockRes();
      admin({}, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });



  describe('approvedAgent', () => {
    it('calls next() for an approved agent', () => {
      const req  = { user: { role: 'agent', status: 'approved' } };
      const next = vi.fn();
      approvedAgent(req, mockRes(), next);
      expect(next).toHaveBeenCalledOnce();
    });

    it('returns 403 for a pending agent', () => {
      const req = { user: { role: 'agent', status: 'pending' } };
      const res = mockRes();
      approvedAgent(req, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 403 for a user (not agent role)', () => {
      const req = { user: { role: 'user', status: 'approved' } };
      const res = mockRes();
      approvedAgent(req, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 403 when req.user is absent', () => {
      const res = mockRes();
      approvedAgent({}, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 403 message "Not authorized Agent"', () => {
      const res = mockRes();
      approvedAgent({}, res, vi.fn());
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized Agent' });
    });
  });



  describe('optionalAuth', () => {
    it('returns 401 when no Authorization header is present', async () => {
      const req  = { headers: {} };
      const res  = mockRes();
      await optionalAuth(req, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 401 when Authorization header does not start with Bearer', async () => {
      const req  = { headers: { authorization: 'Basic xyz' } };
      const res  = mockRes();
      await optionalAuth(req, res, vi.fn());
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});