import { describe, it, expect } from 'vitest';
import { watermarkLogic, getSecretCoordinates } from '../services/hash.service.js';

describe('Boro-Shield Watermarking Logic', () => {
  it('should pick consistent coordinates based on the secret', () => {
    const secret = 'test-secret';
    const coords1 = getSecretCoordinates(secret, 1000);
    const coords2 = getSecretCoordinates(secret, 1000);
    
    expect(coords1).toEqual(coords2); 
    expect(coords1.length).toBe(50); 
  });

  it('should maintain pixel integrity through DCT and IDCT', () => {
    const originalBlock = [
      [255, 255, 255, 255, 255, 255, 255, 255],
      [255, 128, 128, 128, 128, 128, 128, 255],
      [255, 128, 64, 64, 64, 64, 128, 255],
      [255, 128, 64, 32, 32, 64, 128, 255],
      [255, 128, 64, 32, 32, 64, 128, 255],
      [255, 128, 64, 64, 64, 64, 128, 255],
      [255, 128, 128, 128, 128, 128, 128, 255],
      [255, 255, 255, 255, 255, 255, 255, 255],
    ];

    const dct = watermarkLogic.performDCT(originalBlock);
    const idct = watermarkLogic.performIDCT(dct);

   
    expect(idct[0][0]).toBeGreaterThan(250);
    expect(idct[3][3]).toBeLessThan(40);
  });
});