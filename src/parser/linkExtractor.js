const urlRegex = /https?:\/\/[\w.-]+(?:\.[\w\.-]+)+(?:[\/?#][^\s]*)?/gi;

const platformPatterns = {
  weixin: /https?:\/\/mp\.weixin\.qq\.com\/[^\s]+/i,
  zhihu: /https?:\/\/(?:zhuanlan\.|www\.)?zhihu\.com\/[^\s]+/i,
  bilibili: /https?:\/\/(?:www\.)?bilibili\.com\/[^\s]+/i,
};

class LinkExtractor {
  constructor() {
    this.seenLinks = new Set();
  }

  /**
   * 提取文本中的链接并分类
   * @param {string} text 文本内容
   * @returns {Array<{url: string, platform: string, category: 'work'|'other'}>}
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
      const category = ['weixin', 'zhihu'].includes(platform) ? 'work' : 'other';
      results.push({ url: normalized, platform, category });
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
