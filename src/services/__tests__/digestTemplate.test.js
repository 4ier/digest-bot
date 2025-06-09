const template = require('../digestTemplate');

test('generateMarkdown formats content with date', () => {
  const d = new Date('2023-01-02T10:00:00Z');
  const result = template.generateMarkdown('hello', d);
  expect(result).toBe('# 每日摘要 (2023-01-02)\n\nhello\n');
});
