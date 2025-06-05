const axios = require('axios');
const LinkExtractor = require('./linkExtractor');

const extractor = new LinkExtractor();

class LinkValidator {
  constructor() {
    this.extractor = extractor;
  }

  /**
   * 验证链接有效性并提取元数据
   * @param {string} url 链接
   * @returns {Promise<{valid: boolean, status: number, type: string, title: string}>}
   */
  async validate(url) {
    const type = this.extractor.detectPlatform(url);
    try {
      const res = await axios.get(url, { timeout: 5000 });
      const titleMatch = res.data.match(/<title>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : '';
      return { valid: true, status: res.status, type, title };
    } catch (err) {
      return { valid: false, status: err.response?.status || 0, type, title: '' };
    }
  }
}

module.exports = LinkValidator;
