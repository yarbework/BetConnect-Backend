import crypto from 'crypto';

/**
 * Perform a simplified DCT-II on an 8x8 block of pixels
 */
const performDCT = (block) => {
    const N = 8;
    const dctBlock = Array.from({ length: N }, () => new Array(N).fill(0));

    for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
            let sum = 0;
            for (let x = 0; x < N; x++) {
                for (let y = 0; y < N; y++) {
                    sum += block[x][y] * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) * Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
                }
            }
            const alphaU = (u === 0) ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
            const alphaV = (v === 0) ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
            dctBlock[u][v] = alphaU * alphaV * sum;
        }
    }
    return dctBlock;
};

/**
 * Inverse DCT to convert frequencies back to pixels
 */
const performIDCT = (dctBlock) => {
    const N = 8;
    const block = Array.from({ length: N }, () => new Array(N).fill(0));

    for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
            let sum = 0;
            for (let u = 0; u < N; u++) {
                for (let v = 0; v < N; v++) {
                    const alphaU = (u === 0) ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
                    const alphaV = (v === 0) ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
                    sum += alphaU * alphaV * dctBlock[u][v] * Math.cos(((2 * x + 1) * u * Math.PI) / (2 * N)) * Math.cos(((2 * y + 1) * v * Math.PI) / (2 * N));
                }
            }
            block[x][y] = Math.round(sum);
        }
    }
    return block;
};


export const getSecretCoordinates = (secret, totalBlocks) => {
    const hash = crypto.createHmac('sha256', secret).update('boro-seed').digest();
    let seed = hash.readUInt32BE(0);
    
    // Linear Congruential Generator for deterministic randomness
    const coords = [];
    for (let i = 0; i < 50; i++) { // Embed in 50 random blocks
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        coords.push(seed % totalBlocks);
    }
    return coords;
};

export const watermarkLogic = {
    performDCT,
    performIDCT
};