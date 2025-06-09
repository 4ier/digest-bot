const sampleLinks = [
  { url: 'https://example.com/article1', title: '示例文章一' },
  { url: 'https://example.com/article2', title: '示例文章二' },
  { url: 'https://example.com/video1', title: '示例视频一' },
  { url: 'https://mp.weixin.qq.com/s/abc123', title: '微信文章示例' },
  { url: 'https://www.zhihu.com/question/12345', title: '知乎问题示例' },
  { url: 'https://www.bilibili.com/video/BV1', title: 'B站视频示例' },
];

function getMockLinks() {
  return sampleLinks;
}

function getMockSummary(url, style = 'bullet') {
  const prefix = style === 'bullet' ? '• ' : '';
  return `${prefix}这是 ${url} 的摘要演示`;
}

function getMockLinksWithSummaries(style = 'bullet') {
  return sampleLinks.map((link) => ({
    ...link,
    summary: getMockSummary(link.url, style),
  }));
}

module.exports = { getMockLinks, getMockSummary, getMockLinksWithSummaries };
