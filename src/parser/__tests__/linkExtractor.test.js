const LinkExtractor = require('../linkExtractor');

describe('LinkExtractor', () => {
  let extractor;

  beforeEach(() => {
    extractor = new LinkExtractor();
  });

  test('extracts multiple links and classifies platforms', () => {
    const text =
      '看看这个 https://mp.weixin.qq.com/s/abc123 和这个 https://www.zhihu.com/question/12345 还有 https://www.bilibili.com/video/BV1 \n以及 https://v.douyin.com/xyz 和 https://www.xiaohongshu.com/explore/abc 以及重复 https://mp.weixin.qq.com/s/abc123';
    const links = extractor.extract(text);
    expect(links).toEqual([
      { url: 'https://mp.weixin.qq.com/s/abc123', platform: 'weixin', category: 'work', tags: ['article'] },
      { url: 'https://www.zhihu.com/question/12345', platform: 'zhihu', category: 'work', tags: ['article'] },
      { url: 'https://www.bilibili.com/video/BV1', platform: 'bilibili', category: 'other', tags: ['video'] },
      { url: 'https://v.douyin.com/xyz', platform: 'douyin', category: 'other', tags: ['video'] },
      { url: 'https://www.xiaohongshu.com/explore/abc', platform: 'xiaohongshu', category: 'other', tags: ['social'] },
    ]);
  });

  test('returns empty array for no links', () => {
    expect(extractor.extract('hello world')).toEqual([]);
  });

  test('reset clears deduplication state', () => {
    const text = 'https://example.com';
    extractor.extract(text);
    expect(extractor.extract(text)).toEqual([]);
    extractor.reset();
    expect(extractor.extract(text)).toEqual([
      { url: 'https://example.com', platform: 'unknown', category: 'other', tags: [] },
    ]);
  });
});
