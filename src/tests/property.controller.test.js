import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';


vi.mock('../utils/asyncHandler.js', () => ({
  asyncHandler: (fn) => (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  },
}));


vi.mock('../models/property.model.js', () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../services/ai.service.js', () => ({
  generateDescription: vi.fn().mockResolvedValue('AI desc'),
  chatWithData: vi.fn(),
}));


import {
  createProperty, getProperties, getPropertyById,
  updateProperty, deleteProperty,
} from '../controllers/property.controller.js';
import Property from '../models/property.model.js';
import { generateDescription } from '../services/ai.service.js';

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

const agentId = 'agent_001';
const propId  = 'prop_001';

const buildFindChain = (results) => ({
  populate: vi.fn().mockReturnThis(),
  sort: vi.fn().mockReturnThis(),
  skip: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValueOnce(results),
});

describe('createProperty', () => {
  beforeEach(() => vi.clearAllMocks());

  const body = { size: 150, type: 'villa', floor: 2, price: 45000, listingType: 'rent', subcity: 'Bole', woreda: '05', kebele: '10' };

  it('calls generateDescription with correct args', async () => {
    Property.create.mockResolvedValueOnce({ _id: propId });
    await createProperty({ user: { _id: agentId }, body: { ...body, specialName: 'Villa' } }, mockRes(), vi.fn());
    expect(generateDescription).toHaveBeenCalledWith(expect.objectContaining({ subcity: 'Bole', specialName: 'Villa' }));
  });

  it('creates property with agent id', async () => {
    Property.create.mockResolvedValueOnce({ _id: propId });
    await createProperty({ user: { _id: agentId }, body }, mockRes(), vi.fn());
    expect(Property.create).toHaveBeenCalledWith(expect.objectContaining({ agent: agentId }));
  });

  it('responds 201 with created property', async () => {
    const prop = { _id: propId };
    Property.create.mockResolvedValueOnce(prop);
    const res = mockRes();
    await createProperty({ user: { _id: agentId }, body }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(prop);
  });

  it('uses "this property" as specialName fallback', async () => {
    Property.create.mockResolvedValueOnce({});
    await createProperty({ user: { _id: agentId }, body }, mockRes(), vi.fn());
    expect(generateDescription).toHaveBeenCalledWith(expect.objectContaining({ specialName: 'this property' }));
  });

  it('includes AI description in create call', async () => {
    Property.create.mockResolvedValueOnce({});
    await createProperty({ user: { _id: agentId }, body }, mockRes(), vi.fn());
    expect(Property.create).toHaveBeenCalledWith(expect.objectContaining({ aiDescription: 'AI desc' }));
  });

  it('propagates AI errors to next', async () => {
    generateDescription.mockRejectedValueOnce(new Error('AI fail'));
    const next = vi.fn();
    await createProperty({ user: { _id: agentId }, body }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('getProperties', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns paginated results with total', async () => {
    Property.find.mockReturnValueOnce(buildFindChain([{
      toObject: () => ({ _id: propId, agent: { _id: agentId, name: 'A', email: 'a@a.com', phone: '09' } }),
    }]));
    Property.countDocuments.mockResolvedValueOnce(1);
    const res = mockRes();
    await getProperties({ query: {}, user: { _id: 'u1' } }, res, vi.fn());
    const b = res.json.mock.calls[0][0];
    expect(b).toHaveProperty('properties');
    expect(b).toHaveProperty('total', 1);
    expect(b).toHaveProperty('page', 1);
  });

  it('hides agent phone for unauthenticated request', async () => {
    Property.find.mockReturnValueOnce(buildFindChain([{
      toObject: () => ({ _id: propId, agent: { _id: agentId, name: 'A', email: 'a@a.com', phone: '09111' } }),
    }]));
    Property.countDocuments.mockResolvedValueOnce(1);
    const res = mockRes();
    await getProperties({ query: {}, user: undefined }, res, vi.fn());
    expect(res.json.mock.calls[0][0].properties[0].agent).not.toHaveProperty('phone');
  });

  it('preserves agent phone for authenticated request', async () => {
    Property.find.mockReturnValueOnce(buildFindChain([{
      toObject: () => ({ _id: propId, agent: { _id: agentId, name: 'A', email: 'a@a.com', phone: '09111' } }),
    }]));
    Property.countDocuments.mockResolvedValueOnce(1);
    const res = mockRes();
    await getProperties({ query: {}, user: { _id: 'u1' } }, res, vi.fn());
    expect(res.json.mock.calls[0][0].properties[0].agent).toHaveProperty('phone');
  });

  it('applies listingType filter', async () => {
    Property.find.mockReturnValueOnce(buildFindChain([]));
    Property.countDocuments.mockResolvedValueOnce(0);
    await getProperties({ query: { listingType: 'rent' }, user: { _id: 'u1' } }, mockRes(), vi.fn());
    expect(Property.find).toHaveBeenCalledWith(expect.objectContaining({ listingType: 'rent' }));
  });

  it('applies price range filter', async () => {
    Property.find.mockReturnValueOnce(buildFindChain([]));
    Property.countDocuments.mockResolvedValueOnce(0);
    await getProperties({ query: { minPrice: '1000', maxPrice: '5000' }, user: { _id: 'u1' } }, mockRes(), vi.fn());
    expect(Property.find).toHaveBeenCalledWith(expect.objectContaining({ price: { $gte: 1000, $lte: 5000 } }));
  });

  it('applies subcity filter', async () => {
    Property.find.mockReturnValueOnce(buildFindChain([]));
    Property.countDocuments.mockResolvedValueOnce(0);
    await getProperties({ query: { subcity: 'Bole' }, user: { _id: 'u1' } }, mockRes(), vi.fn());
    expect(Property.find).toHaveBeenCalledWith(expect.objectContaining({ subcity: 'Bole' }));
  });

  it('calculates pages correctly', async () => {
    Property.find.mockReturnValueOnce(buildFindChain([]));
    Property.countDocuments.mockResolvedValueOnce(25);
    const res = mockRes();
    await getProperties({ query: { limit: '10' }, user: { _id: 'u1' } }, res, vi.fn());
    expect(res.json.mock.calls[0][0].pages).toBe(3);
  });
});

describe('getPropertyById', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404 when not found', async () => {
    Property.findById.mockReturnValueOnce({ populate: vi.fn().mockResolvedValueOnce(null) });
    const res = mockRes();
    await getPropertyById({ params: { id: 'bad' }, user: null }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Property not found' });
  });

  it('returns property when found', async () => {
    Property.findById.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValueOnce({
        toObject: () => ({ _id: propId, agent: { name: 'A', email: 'a@a.com', phone: '09' } }),
      }),
    });
    const res = mockRes();
    await getPropertyById({ params: { id: propId }, user: { _id: 'u1' } }, res, vi.fn());
    expect(res.json.mock.calls[0][0]._id).toBe(propId);
  });

  it('strips phone for unauthenticated', async () => {
    Property.findById.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValueOnce({
        toObject: () => ({ _id: propId, agent: { name: 'A', email: 'a@a.com', phone: '09111' } }),
      }),
    });
    const res = mockRes();
    await getPropertyById({ params: { id: propId }, user: null }, res, vi.fn());
    expect(res.json.mock.calls[0][0].agent).not.toHaveProperty('phone');
  });

  it('propagates errors to next', async () => {
    Property.findById.mockReturnValueOnce({ populate: vi.fn().mockRejectedValueOnce(new Error('DB fail')) });
    const next = vi.fn();
    await getPropertyById({ params: { id: propId }, user: null }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('updateProperty', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404 when not found', async () => {
    Property.findById.mockResolvedValueOnce(null);
    const res = mockRes();
    await updateProperty({ params: { id: propId }, user: { _id: agentId }, body: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('403 when not the owner', async () => {
    Property.findById.mockResolvedValueOnce({ agent: { toString: () => 'other' } });
    const res = mockRes();
    await updateProperty({ params: { id: propId }, user: { _id: agentId, toString: () => agentId }, body: {} }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('updates and returns property', async () => {
    const saveResult = { _id: propId, price: 48000 };
    Property.findById.mockResolvedValueOnce({
      agent: { toString: () => agentId },
      size: 100, price: 20000,
      save: vi.fn().mockResolvedValueOnce(saveResult),
    });
    const res = mockRes();
    await updateProperty({ params: { id: propId }, user: { _id: agentId, toString: () => agentId }, body: { price: 48000 } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith(saveResult);
  });

  it('partial update only changes supplied fields', async () => {
    const prop = { agent: { toString: () => agentId }, size: 100, price: 20000, save: vi.fn().mockResolvedValueOnce({}) };
    Property.findById.mockResolvedValueOnce(prop);
    await updateProperty({ params: { id: propId }, user: { _id: agentId, toString: () => agentId }, body: { price: 25000 } }, mockRes(), vi.fn());
    expect(prop.price).toBe(25000);
    expect(prop.size).toBe(100);
  });

  it('propagates errors to next', async () => {
    Property.findById.mockRejectedValueOnce(new Error('DB fail'));
    const next = vi.fn();
    await updateProperty({ params: { id: propId }, user: { _id: agentId }, body: {} }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('deleteProperty', () => {
  beforeEach(() => vi.clearAllMocks());

  it('404 when not found', async () => {
    Property.findById.mockResolvedValueOnce(null);
    const res = mockRes();
    await deleteProperty({ params: { id: propId }, user: { _id: agentId } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Property not found' });
  });

  it('403 when not the owner', async () => {
    Property.findById.mockResolvedValueOnce({ agent: { toString: () => 'other' } });
    const res = mockRes();
    await deleteProperty({ params: { id: propId }, user: { _id: agentId, toString: () => agentId } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized to delete this property' });
  });

  it('deletes and returns success', async () => {
    const deleteMock = vi.fn().mockResolvedValueOnce({});
    Property.findById.mockResolvedValueOnce({ agent: { toString: () => agentId }, deleteOne: deleteMock });
    const res = mockRes();
    await deleteProperty({ params: { id: propId }, user: { _id: agentId, toString: () => agentId } }, res, vi.fn());
    expect(deleteMock).toHaveBeenCalledOnce();
    expect(res.json).toHaveBeenCalledWith({ message: 'Property removed' });
  });

  it('propagates errors to next', async () => {
    Property.findById.mockRejectedValueOnce(new Error('DB fail'));
    const next = vi.fn();
    await deleteProperty({ params: { id: propId }, user: { _id: agentId } }, mockRes(), next);
    expect(next).toHaveBeenCalled();
  });
});