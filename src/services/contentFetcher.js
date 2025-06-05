const axios = require('axios');
const cheerio = require('cheerio');

class ContentFetcher {
  constructor() {
    this.cache = new Map();
  }

  /**
   * 获取并清理网页内容
   * @param {string} url 链接
   * @returns {Promise<string>} 纯文本内容
   */
  async fetch(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    try {
      const res = await axios.get(url, { timeout: 5000 });
      const $ = cheerio.load(res.data);
      $('script, style, noscript').remove();
      const text = $('body').text().replace(/\s+/g, ' ').trim();
      this.cache.set(url, text);
      return text;
    } catch (err) {
      throw new Error('内容抓取失败');
    }
  }

  /**
   * 清理缓存
   */
  clear() {
    this.cache.clear();
  }
}

module.exports = new ContentFetcher();
