// jest.setup.js
// Registra los matchers adicionales de jest-extended y habilita jest-chain
// para el encadenamiento fluido: expect(x).toBeString().toBe('valor')

const matchers = require('jest-extended');
expect.extend(matchers);

require('jest-chain');
