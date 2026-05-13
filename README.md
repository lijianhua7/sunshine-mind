# Sunshine Mind (情绪管理与疗愈平台)

**Sunshine Mind** 是一个 AI 驱动的情绪管理与心理洞察平台。通过深度集成 Google Gemini AI，我们为用户提供一个安全、私密且具有同理心的空间，帮助用户记录情绪、进行深度自我探索并获得专业级的疗愈建议。

---

## 体验地址
https://sunshine-mind.vercel.app/

---

## 🌟 核心功能

### 1. 智能情绪问卷 (`Smart Questionnaire`)
- **动态生成**: 根据用户当前选择的情绪状态（如喜悦、焦虑等），AI 实时生成 3 个深度探索问题。
- **结构化引导**: 帮助用户在不想打字时也能通过简单的选项梳理复杂的内心感受。

### 2. 温暖心情日记 (`Emotion Diary`)
- **自由书写**: 提供沉浸式的文本记录环境。
- **危机自检**: 内置 AI 文本安全过滤器。如果检测到自残或极端倾向，系统将立即阻断总结功能并展示危机干预资源。

### 3. Soul Echo AI 陪伴对话 (`Empathetic Chat`)
- **即时倾诉**: AI 扮演一个温暖、非说教的心理陪伴者。
- **对话留档**: 对话结束后可生成转录并安全保存至日记本，记录心境变化。

### 4. 每日洞察看板 (`Daily Insights`)
- **核心情绪提炼**: AI 汇总当日所有记录，精准捕捉今日核心情感。
- **医生寄语**: 为用户生成一段充满力量、具有肯定性的专属疗愈寄语。

### 5. 周期性深度报告 (`Periodic Analytics`)
- **长期趋势**: 分析周/月情绪波动规律。
- **可执行建议**: AI 提供 2-4 条针对个人现状的健康管理与生活建议。

---

## 🛠️ 技术栈

- **前端**: [Next.js 15](https://nextjs.org/) (App Router), [Tailwind CSS 4](https://tailwindcss.com/)
- **动画**: [Framer Motion](https://www.framer.com/motion/)
- **后端/数据库**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **身份认证**: [Firebase Auth](https://firebase.google.com/docs/auth) (Google OAuth)
- **人工智能**: [Google Gemini SDK](https://ai.google.dev/gemini-api/docs/sdk/nodejs) (`@google/genai`)

---

## 🚀 部署与环境配置

### 1. 环境变量
为了使 AI 功能正常运行，你需要在环境中配置以下变量：
- `NEXT_PUBLIC_GEMINI_API_KEY`: 你的 Google AI Studio API Key。

对于本地开发，请在根目录创建 `.env.local`：
```env
NEXT_PUBLIC_GEMINI_API_KEY=你的API密钥
```

### 2. Firebase 安全性说明
- **配置文件**: Firebase 的配置信息保存在 `firebase-applet-config.json` 中。
- **安全性**: Firebase 的客户端 Key 是公开暴露的，这在 Firebase 架构中是**安全且标准**的做法。真正的安全性由 `firestore.rules` 保证。
- **数据隔离**: 我们使用了严格的 Security Rules，确保每个用户只能访问路径为 `/users/{userId}/` 下的属于自己的数据。

---

## 📂 项目结构

- `/app`: Next.js 页面与根布局
- `/components`: 核心功能组件（问卷、日记、聊天、总结）
- `/lib`: 初始化配置（Firebase, Gemini AI SDK, 工具函数）
- `/firestore.rules`: 数据库安全规则定义

---

## 🤝 隐私承诺
**Sunshine Mind** 极其重视用户隐私。所有日记内容均加密存储于云端，且严格遵循单用户隔离策略，除用户本人外，任何人都无法查看原始记录内容。
