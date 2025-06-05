const fetcher = require('../contentFetcher');
const axios = require('axios');

jest.mock('axios');

describe('contentFetcher', () => {
  beforeEach(() => {
    fetcher.clear();
  });

  test('fetches and cleans content', async () => {
    const html = '<html><head><title>t</title></head><body><h1>Hello</h1><script></script></body></html>';
    axios.get.mockResolvedValue({ data: html });
    const text = await fetcher.fetch('https://example.com');
    expect(text).toBe('Hello');
  });

  test('returns cached content', async () => {
    const html = '<html><body>Hi</body></html>';
    axios.get.mockResolvedValue({ data: html });
    const text1 = await fetcher.fetch('https://example.com');
    axios.get.mockResolvedValue({ data: '<html><body>New</body></html>' });
    const text2 = await fetcher.fetch('https://example.com');
    expect(text2).toBe(text1);
  });

  test('throws error on failure', async () => {
    axios.get.mockRejectedValue(new Error('fail'));
    await expect(fetcher.fetch('https://bad.com')).rejects.toThrow('内容抓取失败');
  });
});
