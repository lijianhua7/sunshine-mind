# 晴空心语 (Sunshine Mind) - AI 情绪管理与疗愈平台

**🌐 在线访问 (Live Demo):** [https://sunshine-mind.vercel.app/](https://sunshine-mind.vercel.app/)

**晴空心语** (Sunshine Mind) 是一个以 AI 为核心的情绪收集、管理与建议平台。在这里，你可以通过多种方式记录每日情绪，由 AI 进行深度分析并提供心理医生式的关怀。系统通过长期数据积累，为你提供周期性的情绪洞察，就像一位始终陪伴在你身边的温暖倾听者。

## 🌟 核心功能 (Features)

### 1. 多维度情绪记录 (Emotional Tracking)
*   **静心问卷 (Guided Questionnaire)**：通过简单的四种基础情绪（开心、沮丧、委屈、平静）选择，触发 AI 动态生成的深入追问。在不想打字时，通过点选也能快速梳理内心脉络。
*   **灵魂日记 (Soul Diary)**：自由书写内心体验，尽情倾诉。每一次提交都会获得 AI 提炼的“温柔小结”与共情回应。
*   **心声回响 (Soul Echo AI Chat)**：像和老朋友聊天一样与 AI 进行实时对话。无需正襟危坐，在自然交流中梳理情绪。

### 2. 深度分析与反馈 (Insights & Feedback)
*   **每日洞察 (Daily Insights)**：系统会将你全天碎片化的记录汇聚成一份“昨日总结”，包含核心情绪标签、标志性关键事件，以及充满正向能量的医生视角寄语。
*   **周期回顾 (Periodic Reports)**：支持查看情绪趋势，回顾过去一段时间的情绪高配事件与潜在诱因，帮助你更好地了解自己。

### 3. 用户与隐私核心保障 (Privacy First)
*   **严格的用户隔离**：所有日记与问卷数据均依托 Google Firebase 的安全规则进行强隔离。只有你本人可以访问和读取你的内心世界。
*   **柔性危机干预**：当 AI 识别到极度负面或有害信息时，将触发“温柔阻断”机制，停止深度追问并给出舒缓建议。

## 🛠️ 技术栈 (Tech Stack)

*   **前端框架**: Next.js 15 (App Router), React, TypeScript
*   **样式方案**: Tailwind CSS, PostCSS, Framer Motion (用于温和的过渡动画)
*   **UI 组件库**: Radix UI (无头组件), Lucide React (图标)
*   **数据库 & 鉴权**: Firebase Firestore, Firebase Authentication
*   **AI 引擎**: Google Gemini Pro (基于 `@google/genai` TypeScript SDK)

## 🚀 部署指南 (Deployment)

1.  **Firebase 设置**: 
    - 创建 Firebase 项目。
    - 启用 **Authentication** (Google Login) 和 **Firestore** (Enterprise Edition)。
    - 将 `firestore.rules` 部署到你的 Firestore 实例中以确保数据安全。
2.  **环境变量配置**:
    - 在项目根目录创建 `.env` 文件，并填写必要的环境变量（参考 `.env.example`）：
      ```env
      NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
      ```
3.  **安装与运行**:
    ```bash
    npm install
    npm run dev
    ```

## 🎨 设计原则 (Design Philosophy)

*   **色调感官**：使用低饱和度、柔和的暖色调（如米白、暖灰、柔和的莫兰迪色系），避免任何刺激性色彩。
*   **语言风格**：无论是界面文案还是 AI 的回复，始终保持温和、中立且具备同理心，绝不说教。
*   **交互缓动**：所有元素的出现和消失采用轻柔的淡入淡出，给予用户最大的安全感和缓冲空间。