<!-- bcec53d9-3992-4c94-b4e1-2ed71371abea 9425492c-c3cb-46da-9682-f140623b82e5 -->
# Suno API音乐生成功能实现规划

## 目标

实现左侧编辑区编辑完成后，通过调用Suno API生成音乐，并在右侧展示生成结果。

## 实现步骤

### 1. 环境配置

- 在 `.env` 文件中添加 `SUNO_API_KEY` 环境变量
- 创建 `lib/suno/client.ts` 封装Suno API调用逻辑

### 2. 数据库Schema扩展

- 在 `lib/db/schema.ts` 中添加 `musicTracks` 表，用于存储生成的音乐记录
- 字段包括：id, userId, title, description, lyrics, audioUrl, status, sunoTaskId, createdAt等
- 运行数据库迁移

### 3. 创建API路由

- 创建 `app/api/music/generate/route.ts` - 处理音乐生成请求
- POST方法接收前端提交的表单数据（mode, description, lyrics, styles等）
- 调用Suno API创建生成任务
- 将任务信息保存到数据库
- 返回任务ID和初始状态

- 创建 `app/api/music/status/[taskId]/route.ts` - 轮询任务状态
- GET方法根据taskId查询Suno API任务状态
- 更新数据库中的音乐记录
- 返回当前状态和音频URL（如果已完成）

- 创建 `app/api/music/tracks/route.ts` - 获取用户生成的音乐列表
- GET方法返回当前用户的所有音乐记录

### 4. 前端状态管理优化

- 在 `app/(dashboard)/music-generator/page.tsx` 中：
- 添加 `generatedTracks` 状态，从API获取真实数据
- 修改 `handleGenerate` 函数，调用 `/api/music/generate` API
- 实现轮询机制，定期查询任务状态（使用setInterval或useEffect）
- 当任务完成时，更新 `generatedTracks` 列表
- 添加错误处理和加载状态提示

### 5. 音乐播放功能

- 更新 `MusicTrack` 接口，添加 `audioUrl` 和 `status` 字段
- 实现真实的音频播放器，使用HTML5 audio元素或第三方库
- 添加播放进度更新逻辑（使用audio事件监听）

### 6. 用户体验优化

- 添加生成进度提示（显示"生成中..."、"处理中..."等状态）
- 实现任务状态轮询的自动停止机制（任务完成或失败时）
- 添加错误提示和重试功能
- 优化加载动画和状态反馈

## 技术要点

1. **异步处理**：Suno API生成是异步的，需要轮询任务状态
2. **状态管理**：使用React状态管理生成任务和音乐列表
3. **错误处理**：妥善处理API调用失败、网络错误等情况
4. **数据持久化**：将生成的音乐信息保存到数据库，方便后续查看

## 文件修改清单

- `lib/db/schema.ts` - 添加musicTracks表定义
- `lib/suno/client.ts` - 新建Suno API客户端
- `app/api/music/generate/route.ts` - 新建生成API
- `app/api/music/status/[taskId]/route.ts` - 新建状态查询API
- `app/api/music/tracks/route.ts` - 新建音乐列表API
- `app/(dashboard)/music-generator/page.tsx` - 修改前端逻辑
- `.env.example` - 添加SUNO_API_KEY示例

## 注意事项

- Suno API可能需要特定的请求格式和认证方式，需要根据实际API文档调整
- 轮询间隔建议设置为3-5秒，避免过于频繁的请求
- 考虑添加请求限制和错误重试机制
- 音频文件URL可能需要代理或CORS处理

Suno api 文档地址：https://docs.sunoapi.org/#welcome-to-suno-api-documentation

### To-dos

- [ ] 配置环境变量，添加SUNO_API_KEY到.env文件
- [ ] 创建lib/suno/client.ts，封装Suno API调用逻辑
- [ ] 在lib/db/schema.ts中添加musicTracks表定义
- [ ] 创建app/api/music/generate/route.ts处理音乐生成请求
- [ ] 创建app/api/music/status/[taskId]/route.ts用于轮询任务状态
- [ ] 创建app/api/music/tracks/route.ts获取用户音乐列表
- [ ] 修改page.tsx实现API调用、轮询机制和状态更新
- [ ] 实现真实的音频播放功能，使用audioUrl播放音乐