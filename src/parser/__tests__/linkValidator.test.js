const LinkValidator = require('../linkValidator');
const axios = require('axios');

jest.mock('axios');

describe('LinkValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new LinkValidator();
  });

  test('valid link returns metadata', async () => {
    axios.get.mockResolvedValue({ status: 200, data: '<title>Test</title>' });
    const result = await validator.validate('https://mp.weixin.qq.com/s/abc');
    expect(result).toEqual({ valid: true, status: 200, type: 'weixin', title: 'Test' });
  });

  test('invalid link returns false', async () => {
    axios.get.mockRejectedValue({ response: { status: 404 } });
    const result = await validator.validate('https://example.com');
    expect(result).toEqual({ valid: false, status: 404, type: 'unknown', title: '' });
  });
});
