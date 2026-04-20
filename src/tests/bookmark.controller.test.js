import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';


vi.mock('../utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  },
}));


vi.mock('../models/bookmark.model.js', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    find: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
}));

// Then import
import { addBookmark, getBookmarks, removeBookmark } from '../controllers/bookmark.controller.js';
import Bookmark from '../models/bookmark.model.js';

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

describe('addBookmark', () => {
  beforeEach(() => vi.clearAllMocks());

  it('400 when already bookmarked', async () => {
    Bookmark.findOne.mockResolvedValueOnce({ _id: 'bm1' });
    const res = mockRes();
    await addBookmark({ user: { _id: 'u1' }, params: { propertyId: 'p1' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Already bookmarked' });
  });

  it('201 when creating new bookmark', async () => {
    Bookmark.findOne.mockResolvedValueOnce(null);
    const bm = { _id: 'bm2', user: 'u1', property: 'p1' };
    Bookmark.create.mockResolvedValueOnce(bm);
    const res = mockRes();
    await addBookmark({ user: { _id: 'u1' }, params: { propertyId: 'p1' } }, res, vi.fn());
    expect(Bookmark.create).toHaveBeenCalledWith({ user: 'u1', property: 'p1' });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(bm);
  });

  it('checks with correct user and property ids', async () => {
    Bookmark.findOne.mockResolvedValueOnce(null);
    Bookmark.create.mockResolvedValueOnce({});
    await addBookmark({ user: { _id: 'userA' }, params: { propertyId: 'propB' } }, mockRes(), vi.fn());
    expect(Bookmark.findOne).toHaveBeenCalledWith({ user: 'userA', property: 'propB' });
  });

  it('propagates errors to next', async () => {
    Bookmark.findOne.mockRejectedValueOnce(new Error('DB fail'));
    const next = vi.fn();
    await addBookmark({ user: { _id: 'u1' }, params: { propertyId: 'p1' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('getBookmarks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns populated list', async () => {
    const bms = [{ _id: 'bm1', property: { _id: 'p1' } }];
    Bookmark.find.mockReturnValueOnce({ populate: vi.fn().mockResolvedValueOnce(bms) });
    const res = mockRes();
    await getBookmarks({ user: { _id: 'u1' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(bms);
  });

  it('returns empty array when no bookmarks', async () => {
    Bookmark.find.mockReturnValueOnce({ populate: vi.fn().mockResolvedValueOnce([]) });
    const res = mockRes();
    await getBookmarks({ user: { _id: 'u2' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('queries with correct user id', async () => {
    Bookmark.find.mockReturnValueOnce({ populate: vi.fn().mockResolvedValueOnce([]) });
    await getBookmarks({ user: { _id: 'specificUser' } }, mockRes(), vi.fn());
    expect(Bookmark.find).toHaveBeenCalledWith({ user: 'specificUser' });
  });

  it('populates the property field', async () => {
    const populateMock = vi.fn().mockResolvedValueOnce([]);
    Bookmark.find.mockReturnValueOnce({ populate: populateMock });
    await getBookmarks({ user: { _id: 'u1' } }, mockRes(), vi.fn());
    expect(populateMock).toHaveBeenCalledWith('property');
  });

  it('propagates errors to next', async () => {
    Bookmark.find.mockReturnValueOnce({ populate: vi.fn().mockRejectedValueOnce(new Error('DB fail')) });
    const next = vi.fn();
    await getBookmarks({ user: { _id: 'u1' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('removeBookmark', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404 when not found', async () => {
    Bookmark.findOneAndDelete.mockResolvedValueOnce(null);
    const res = mockRes();
    await removeBookmark({ user: { _id: 'u1' }, params: { propertyId: 'p1' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Bookmark not found' });
  });

  it('removes and returns success message', async () => {
    Bookmark.findOneAndDelete.mockResolvedValueOnce({ _id: 'bm1' });
    const res = mockRes();
    await removeBookmark({ user: { _id: 'u1' }, params: { propertyId: 'p1' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ message: 'Bookmark removed' });
  });

  it('deletes with correct ids', async () => {
    Bookmark.findOneAndDelete.mockResolvedValueOnce({ _id: 'bm1' });
    await removeBookmark({ user: { _id: 'uX' }, params: { propertyId: 'pY' } }, mockRes(), vi.fn());
    expect(Bookmark.findOneAndDelete).toHaveBeenCalledWith({ user: 'uX', property: 'pY' });
  });

  it('propagates errors to next', async () => {
    Bookmark.findOneAndDelete.mockRejectedValueOnce(new Error('DB fail'));
    const next = vi.fn();
    await removeBookmark({ user: { _id: 'u1' }, params: { propertyId: 'p1' } }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});