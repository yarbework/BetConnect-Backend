import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/property.model.js', () => ({
  default: { find: vi.fn() },
}));
vi.mock('../services/ai.service.js', () => ({
  generateDescription: vi.fn().mockResolvedValue('desc'),
  chatWithData: vi.fn(),
}));

import { handleChat } from '../controllers/ai.controller.js';
import Property from '../models/property.model.js';
import { chatWithData } from '../services/ai.service.js';

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

const chain = (results) => ({
  limit: vi.fn().mockReturnThis(),
  select: vi.fn().mockResolvedValueOnce(results),
});

describe('handleChat controller', () => {
  beforeEach(() => vi.clearAllMocks());

  it('queries rent when message contains "rent"', async () => {
    Property.find.mockReturnValueOnce(chain([]));
    chatWithData.mockResolvedValueOnce('ok');
    await handleChat({ body: { message: 'I want to rent in Bole' } }, mockRes(), vi.fn());
    expect(Property.find).toHaveBeenCalledWith(expect.objectContaining({ listingType: 'rent' }));
  });

  it('queries sale when message contains "buy"', async () => {
    Property.find.mockReturnValueOnce(chain([]));
    chatWithData.mockResolvedValueOnce('ok');
    await handleChat({ body: { message: 'I want to buy a house' } }, mockRes(), vi.fn());
    expect(Property.find).toHaveBeenCalledWith(expect.objectContaining({ listingType: 'sale' }));
  });

  it('queries sale when message contains "sale"', async () => {
    Property.find.mockReturnValueOnce(chain([]));
    chatWithData.mockResolvedValueOnce('ok');
    await handleChat({ body: { message: 'properties for sale' } }, mockRes(), vi.fn());
    expect(Property.find).toHaveBeenCalledWith(expect.objectContaining({ listingType: 'sale' }));
  });

  it('filters by subcity when Bole is mentioned', async () => {
    Property.find.mockReturnValueOnce(chain([]));
    chatWithData.mockResolvedValueOnce('ok');
    await handleChat({ body: { message: 'apartments in Bole' } }, mockRes(), vi.fn());
    const arg = Property.find.mock.calls[0][0];
    expect(arg.subcity).toBeDefined();
    expect(arg.subcity.toString()).toContain('Bole');
  });

  it('no subcity filter for unknown location', async () => {
    Property.find.mockReturnValueOnce(chain([]));
    chatWithData.mockResolvedValueOnce('ok');
    await handleChat({ body: { message: 'looking for a nice place' } }, mockRes(), vi.fn());
    expect(Property.find.mock.calls[0][0]).not.toHaveProperty('subcity');
  });

  it('returns AI response in body', async () => {
    Property.find.mockReturnValueOnce(chain([]));
    chatWithData.mockResolvedValueOnce('Great options!');
    const res = mockRes();
    await handleChat({ body: { message: 'find me something' } }, res, vi.fn());
    expect(res.json).toHaveBeenCalledWith({ response: 'Great options!' });
  });

  it('returns 500 when chatWithData throws', async () => {
    Property.find.mockReturnValueOnce(chain([]));
    chatWithData.mockRejectedValueOnce(new Error('AI down'));
    const res = mockRes();
    await handleChat({ body: { message: 'find me something' } }, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'AI down' });
  });

  it('limits query to 5', async () => {
    const limitMock = vi.fn().mockReturnThis();
    const selectMock = vi.fn().mockResolvedValueOnce([]);
    Property.find.mockReturnValueOnce({ limit: limitMock, select: selectMock });
    chatWithData.mockResolvedValueOnce('ok');
    await handleChat({ body: { message: 'find property' } }, mockRes(), vi.fn());
    expect(limitMock).toHaveBeenCalledWith(5);
  });

  it('passes matched properties to chatWithData', async () => {
    const props = [{ _id: 'p1', price: 5000 }];
    Property.find.mockReturnValueOnce(chain(props));
    chatWithData.mockResolvedValueOnce('results');
    await handleChat({ body: { message: 'rent in Bole' } }, mockRes(), vi.fn());
    expect(chatWithData).toHaveBeenCalledWith('rent in Bole', expect.arrayContaining([expect.objectContaining({ _id: 'p1' })]));
  });

  it.each(['CMC','Lebu','Ayat','Kazanchis','Lideta'])('detects subcity %s', async (subcity) => {
    Property.find.mockReturnValueOnce(chain([]));
    chatWithData.mockResolvedValueOnce('ok');
    await handleChat({ body: { message: `rent near ${subcity}` } }, mockRes(), vi.fn());
    expect(Property.find.mock.calls[0][0].subcity).toBeDefined();
  });
});