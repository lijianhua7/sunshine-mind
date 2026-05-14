# Sunshine Mind Agent Instructions

这是一个以 AI 为核心的情绪收集、管理与建议平台 (Sunshine Mind / 晴空心语)。
作为辅助开发的 AI 助手，在生成代码或分析问题时，**必须严格遵守**以下指令：

## 1. 核心交互与 AI 设定 (Core AI Persona & Interaction)
- **绝对的同理心与情感安全**：在所有 AI Prompt 及系统文案设计中，优先级最高的是“情感安全”。语气必须温暖、包容、不评判（non-judgmental）。
- **拒绝说教**：绝不要使用爹味、生硬或“你应该怎样”的语气。应采用“医生视角”或“知心老友”的口吻提供正向反馈与洞察。
- **温柔阻断机制**：如果用户的输入或内容检测到严重的负面倾向或危机信号，不要过度追问。应通过 AI Prompt 触发柔和的安抚，并建议休息或寻求专业帮助；不要提供临床医疗建议。

## 2. 前端设计与视觉指南 (Frontend & Design Rules)
- **色调与感官**：必须坚持低饱和度、柔和的色彩体系。界面应以米白、暖灰为主，绝对避免高对比度、刺激性的鲜艳色彩，营造一种治愈、宁静的避风港氛围。
- **字体排印**：使用易读、雅致的无衬线字体为主，日记输入区可搭配优雅的衬线体（Serif）以增强文学感和私密感。
- **动效约束**：所有的状态切换、弹窗、路由跳转，必须使用 `framer-motion` 添加柔和的淡入淡出（Fade & Blur）过渡，避免突兀的闪跳变化。

## 3. 后端、数据与安全 (Backend & Security Invariants)
- **数据绝对私密**：项目依赖 Firebase Firestore 存储数据。所有读写（包括 entries，summaries 等集合）必须受 `firestore.rules` 的强力保护。任何查询及展示必须通过 `where("userId", "==", user.uid)` 确保获取的数据仅限当前登录用户所有。不要使用 Mock 数据来展示情绪或日记。
- **客户端 AI 调用**：Gemini AI API (使用 `@google/genai` 且限定模型为 `gemini-3-flash-preview` 或更优) 必须在前端组件或 Next.js API Routes 中安全调用。
- **无感错误降级**：保存数据遇到问题时，做好向 LocalStorage 的兜底备份，不要让用户的心声轻易丢失。捕获错误时，要以最温柔的文案提示（例如：“保存遇到了一点小麻烦，思绪已暂存在本地”），而不是展示生硬的系统报错。

## 4. 开发架构 (Architecture)
- 使用 Next.js App Router 范式，坚持可维护和解耦的原则。
- 采用 Tailwind CSS 处理样式（通过 `@import "tailwindcss"` 及 `postcss`）。不要创建传统的 css 类。
- 所有的图标仅从 `lucide-react` 中引入。