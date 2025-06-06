const { AppError } = require('../errors');

describe('AppError', () => {
  test('sets message and status', () => {
    const err = new AppError('msg', 400);
    expect(err.message).toBe('msg');
    expect(err.status).toBe(400);
    expect(err).toBeInstanceOf(Error);
  });
});
