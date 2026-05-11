# Sunshine Mind (情绪管理与疗愈平台) - 项目分析与指令库

本文件记录了项目的核心架构、技术栈、AI 集成点以及后续开发的全局准则，旨在确保 AI 代理在后续迭代中保持逻辑的一致性与专业性。

## 1. 项目核心愿景
**Sunshine Mind** 是一个 AI 驱动的情绪管理与心理洞察平台。其核心理念是提供一个安全、私密、且具有同理情的空间，让用户通过记录、对话和观察，实现自我情感的疗愈与成长。

## 2. 技术规格
- **框架**: Next.js 15 (App Router)
- **样式**: Tailwind CSS 4, Lucide React (图标)
- **动画**: Framer Motion (`motion/react`)
- **数据库**: Firebase Firestore (Enterprise 版)
- **身份认证**: Firebase Authentication (Google OAuth 弹窗)
- **AI 模型**: Google Gemini (通过 `@google/genai` SDK)

## 3. 功能模块与 AI 逻辑实现
项目包含五个核心功能模块，均深度集成了 Gemini AI：

| 功能模块 | 代码实现路径 | AI 具体作用 |
| :--- | :--- | :--- |
| **智能问卷** | `components/QuestionnaireView.tsx` | 根据选定情绪动态生成结构化 JSON 格式的心理探索问题。 |
| **心情日记** | `components/DiaryView.tsx` | 进行文本危机自残检测（SAFE/DANGER 判定），保障用户安全。 |
| **陪伴对话** | `components/ChatView.tsx` | 作为“Soul Echo AI”咨询师，提供温暖、非医疗性、具有共情力的即时倾诉。 |
| **每日洞察** | `components/DailySummaryView.tsx` | 汇总当日全量记录，归纳核心情绪、关键事件，生成医生寄语。 |
| **周期分析** | `components/PeriodicReportView.tsx` | 分析长期趋势，生成周报总结并给出 2-4 条可执行的健康建议。 |

## 4. 关键架构规范 (Agent 必读)

### 4.1 数据安全与隐私隔离 (Firestore)
- **强制约束**: 必须遵循 `firestore.rules` 中的安全定义。数据结构必须以 `/users/{userId}/...` 为根路径，严格实现用户间数据完全隔离。
- **错误处理**: 在 `lib/firebase.ts` 中集成了 `handleFirestoreError`。任何数据库操作失败必须返回结构化的 JSON 错误信息，严禁静默失败。

### 4.2 AI 交互规范 (Gemini SDK)
- **模型选择**: 文本处理首选 `gemini-pro` 或通过别名 `MODELS.text` 调用。
- **结构化输出**: 必须优先使用 `responseSchema` 强制模型返回 JSON 格式，严禁让 AI 返回非结构化的混合文本。
- **客户端调用**: AI 请求必须在客户端组件中发起（使用 `'use client'`），并确保 `NEXT_PUBLIC_GEMINI_API_KEY` 环境变量已正确加载。

### 4.3 UI 设计语言 (Sunshine Mind 风格)
- **视觉风格**: 以“暖色调、磨砂玻璃 (Glassmorphism)、大量圆角 (rounded-3xl)”为核心。
- **色彩偏好**: 常用 `Deep Sage` (深鼠尾草绿), `Amber` (琥珀黄), `Teal` (青色)，背景多采用渐变色块。
- **交互反馈**: 按钮悬停必须有微小的缩放效果 (`hover:scale-[1.02]`)，所有状态切换必须配合 `AnimatePresence` 实现平滑过渡。

## 5. 后续迭代建议
1. **数据可视化**: 后续可加强在 `PeriodicReportView` 中引入 D3 或 Recharts，将 AI 分析过的情绪趋势可视化呈现。
2. **离线处理**: 优化 Firebase Firestore 的离线持久化存储，确保即便在网络不稳时用户也能完成记录。
3. **语音集成**: 考虑在 `ChatView` 中集成 Web Speech API 或 Gemini 的音频输入能力，实现语音倾诉。
