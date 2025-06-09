const urlRegex = /https?:\/\/[\w.-]+(?:\.[\w.-]+)+(?:[/?#][^\s]*)?/gi;

const platformPatterns = {
  weixin: /https?:\/\/mp\.weixin\.qq\.com\/[^\s]+/i,
  zhihu: /https?:\/\/(?:zhuanlan\.|www\.)?zhihu\.com\/[^\s]+/i,
  bilibili: /https?:\/\/(?:www\.)?bilibili\.com\/[^\s]+/i,
  douyin: /https?:\/\/(?:v|www)\.douyin\.com\/[^\s]+/i,
  xiaohongshu: /https?:\/\/www\.xiaohongshu\.com\/[^\s]+/i,
};

const platformMeta = {
  weixin: { category: 'work', tags: ['article'] },
  zhihu: { category: 'work', tags: ['article'] },
  bilibili: { category: 'other', tags: ['video'] },
  douyin: { category: 'other', tags: ['video'] },
  xiaohongshu: { category: 'other', tags: ['social'] },
  unknown: { category: 'other', tags: [] },
};

class LinkExtractor {
  constructor() {
    this.seenLinks = new Set();
  }

  /**
   * 提取文本中的链接并分类
   * @param {string} text 文本内容
   * @returns {Array<{url: string, platform: string, category: string, tags: string[]}>}
   */
  extract(text) {
    if (!text) return [];
    const matches = text.match(urlRegex) || [];
    const results = [];

    for (const url of matches) {
      const normalized = url.replace(/[.,\u3002]+$/g, '');
      if (this.seenLinks.has(normalized)) continue;
      this.seenLinks.add(normalized);
      const platform = this.detectPlatform(normalized);
      const meta = platformMeta[platform] || platformMeta.unknown;
      results.push({ url: normalized, platform, category: meta.category, tags: meta.tags });
    }

    return results;
  }

  /**
   * 根据链接判断所属平台
   * @param {string} url 链接
   * @returns {string}
   */
  detectPlatform(url) {
    if (platformPatterns.weixin.test(url)) return 'weixin';
    if (platformPatterns.zhihu.test(url)) return 'zhihu';
    if (platformPatterns.bilibili.test(url)) return 'bilibili';
    if (platformPatterns.douyin.test(url)) return 'douyin';
    if (platformPatterns.xiaohongshu.test(url)) return 'xiaohongshu';
    return 'unknown';
  }

  /**
   * 清除已记录的链接（用于新消息会话）
   */
  reset() {
    this.seenLinks.clear();
  }
}

module.exports = LinkExtractor;
