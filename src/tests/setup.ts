// src/tests/setup.ts
// Global test setup — runs before every test file

// Make vi globally available (Vitest)
import { vi } from 'vitest';

// Reset mocks between tests
beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
});
