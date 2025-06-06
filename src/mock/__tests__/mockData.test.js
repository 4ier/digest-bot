const mockData = require('../mockData');

describe('mockData', () => {
  test('returns links with summaries', () => {
    const data = mockData.getMockLinksWithSummaries();
    expect(data.length).toBeGreaterThan(0);
    data.forEach(item => {
      expect(item.url).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.summary).toContain(item.url);
    });
  });
});
