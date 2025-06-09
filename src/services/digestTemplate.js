const VERSION = 'v1';

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateMarkdown(content, date = new Date()) {
  const dateStr = formatDate(date);
  return `# 每日摘要 (${dateStr})\n\n${content}\n`;
}

module.exports = {
  VERSION,
  generateMarkdown,
};
