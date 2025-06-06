# 长话短说Bot (Feishu Digest Bot)

一个自动收集和总结团队群聊中分享内容的飞书机器人。

## 功能特点

- 自动识别群聊中的链接消息
- 支持主流平台：微信文章、知乎、B站视频等
- 使用 GPT 生成内容摘要
- 每天晚上 8 点自动生成日报
- 支持多租户隔离
- 支持按租户配置推送时间、启用群聊和摘要样式

## 技术栈

- Node.js
- MongoDB
- OpenAI GPT API
- 飞书开放平台 SDK

## 开发环境要求

- Node.js >= 18.0.0
- MongoDB >= 6.0
- 飞书开发者账号
- OpenAI API Key

## 快速开始

1. 克隆项目
```bash
git clone [repository-url]
cd feishu-digest-bot
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置信息
# 如需演示模式，可将 ENABLE_MOCK_DATA 设置为 true
```

4. 启动开发服务器
```bash
npm run dev
```

## 演示模式

当 `ENABLE_MOCK_DATA` 设置为 `true` 时，应用将生成演示用的链接和摘要。
启动后访问 `/demo/mock-data` 即可获取示例数据。

## 项目结构

```
feishu-digest-bot/
├── src/                    # 源代码目录
│   ├── bot/               # 飞书机器人相关代码
│   ├── parser/            # 内容解析相关代码
│   ├── summarizer/        # 摘要生成相关代码
│   └── config/            # 配置文件
├── tests/                 # 测试文件
├── .env.example          # 环境变量示例
├── .eslintrc.js          # ESLint 配置
├── .prettierrc           # Prettier 配置
└── package.json          # 项目依赖
```

## 开发指南

- 遵循 ESLint 和 Prettier 的代码规范
- 编写单元测试确保代码质量
- 使用 Git Flow 工作流进行开发

## 许可证

MIT 