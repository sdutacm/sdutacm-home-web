# 大文件分片上传技术文档

## 概述

本次修改为音视频媒体文件实现了分片上传功能，解除了原有 10MB 的文件大小限制，支持最大 500MB 的音视频文件上传。

## 技术方案

### 核心原理

采用 **分片上传（Chunked Upload）** 技术：
1. 将大文件切割成多个固定大小的分片（2MB/片）
2. 逐个上传分片到服务器临时目录
3. 所有分片上传完成后，服务端合并分片为完整文件

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + vue-class-component |
| UI 组件 | Element Plus (ElUpload, ElProgress) |
| 后端框架 | bwcx-ljsm (基于 Koa) |
| 数据校验 | class-validator |
| 文件操作 | Node.js fs 模块 |
| 唯一标识 | crypto.randomBytes |

## 文件修改清单

### 1. DTO 定义

**文件**: `src/common/modules/media/media.dto.ts`

新增 6 个 DTO 类：

```typescript
// 初始化分片上传请求/响应
InitChunkUploadReqDTO {
  filename: string;      // 文件名
  fileSize: number;      // 文件总大小
  type: MediaTypeEnum;   // 媒体类型
  alt?: string;          // 描述（可选）
  totalChunks: number;   // 总分片数
}

InitChunkUploadResDTO {
  uploadId: string;      // 上传会话ID
  chunkSize: number;     // 分片大小
}

// 上传分片请求/响应
UploadChunkReqDTO {
  uploadId: string;      // 上传会话ID
  chunkIndex: number;    // 分片索引（0开始）
  chunk: any;            // 分片数据（文件）
}

UploadChunkResDTO {
  chunkIndex: number;    // 分片索引
  received: boolean;     // 是否接收成功
}

// 完成上传请求/响应
CompleteChunkUploadReqDTO {
  uploadId: string;      // 上传会话ID
}

CompleteChunkUploadResDTO extends MediaDetailResDTO {}
```

### 2. 服务端实现

**文件**: `src/server/modules/media/media.service.ts`

#### 2.1 状态管理

```typescript
// 分片上传状态接口
interface ChunkUploadState {
  uploadId: string;           // 上传会话ID
  filename: string;           // 原始文件名
  fileSize: number;           // 文件总大小
  type: MediaTypeEnum;        // 媒体类型
  alt?: string;               // 描述
  totalChunks: number;        // 总分片数
  receivedChunks: Set<number>; // 已接收分片索引集合
  tempDir: string;            // 临时目录路径
  createdAt: Date;            // 创建时间
  admin: any;                 // 上传管理员信息
}

// 内存存储（生产环境建议使用 Redis）
const chunkUploadStates = new Map<string, ChunkUploadState>();

// 分片大小常量
const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB
```

#### 2.2 核心方法

| 方法 | 功能 | 关键逻辑 |
|------|------|----------|
| `initChunkUpload()` | 初始化上传 | 验证文件类型、生成 uploadId、创建临时目录、保存状态 |
| `uploadChunk()` | 接收分片 | 验证 uploadId、保存分片到临时目录、标记已接收 |
| `completeChunkUpload()` | 完成上传 | 检查分片完整性、合并文件、保存数据库、清理临时文件 |
| `cleanupTempDir()` | 清理临时目录 | 删除临时分片文件和目录 |

#### 2.3 文件合并逻辑

```typescript
// 使用 WriteStream 顺序写入
const writeStream = fs.createWriteStream(finalPath);
for (let i = 0; i < state.totalChunks; i++) {
  const chunkPath = path.join(state.tempDir, `chunk_${i}`);
  const chunkData = fs.readFileSync(chunkPath);
  writeStream.write(chunkData);
}
writeStream.end();

// 等待写入完成
await new Promise<void>((resolve, reject) => {
  writeStream.on('finish', resolve);
  writeStream.on('error', reject);
});
```

### 3. 控制器接口

**文件**: `src/server/modules/media/media.controller.ts`

新增 3 个 API 端点：

| 端点 | 方法 | 请求 DTO | 响应 DTO |
|------|------|----------|----------|
| `/initChunkUpload` | POST | InitChunkUploadReqDTO | InitChunkUploadResDTO |
| `/uploadChunk` | POST | UploadChunkReqDTO | UploadChunkResDTO |
| `/completeChunkUpload` | POST | CompleteChunkUploadReqDTO | CompleteChunkUploadResDTO |

### 4. 前端实现

**文件**: `src/client/components/admin/media-dialog.vue`

#### 4.1 常量配置

```typescript
// 分片大小（与服务端一致）
const CHUNK_SIZE = 2 * 1024 * 1024;       // 2MB
// 普通文件大小限制
const NORMAL_FILE_SIZE_LIMIT = 10 * 1024 * 1024;   // 10MB
// 大文件大小限制（音视频）
const LARGE_FILE_SIZE_LIMIT = 500 * 1024 * 1024;  // 500MB
```

#### 4.2 上传决策逻辑

```typescript
// 判断是否为大文件类型
get isLargeFileType() {
  return this.mediaType === MediaTypeEnum.AUDIO || 
         this.mediaType === MediaTypeEnum.VIDEO;
}

// 上传时的判断
if (this.isLargeFileType && rawFile.size > NORMAL_FILE_SIZE_LIMIT) {
  // 分片上传
  return await this.uploadFileInChunks(rawFile, type, alt);
} else {
  // 普通上传
  return await this.$api.uploadMedia({ file, type, alt });
}
```

#### 4.3 分片上传核心方法

```typescript
async uploadFileInChunks(file: File, type: MediaTypeEnum, alt?: string) {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

  // Step 1: 初始化
  const { uploadId, chunkSize } = await this.$api.initChunkUpload({
    filename: file.name,
    fileSize: file.size,
    type,
    alt,
    totalChunks,
  });

  // Step 2: 逐片上传
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    await this.$api.uploadChunk({ uploadId, chunkIndex: i, chunk });

    // 更新进度
    this.uploadProgress = Math.round(((i + 1) / totalChunks) * 100);
  }

  // Step 3: 完成上传
  return await this.$api.completeChunkUpload({ uploadId });
}
```

#### 4.4 UI 增强

- 添加 `ElProgress` 组件显示上传进度
- 动态显示文件大小限制提示（10MB / 500MB）

### 5. 配置文件增强

**文件**: `src/common/config/media-type-config.ts`

新增函数：
```typescript
export function getMediaTypeConfig(mediaType: MediaTypeEnum): MediaTypeConfig | undefined {
  return MEDIA_TYPE_CONFIG[mediaType];
}
```

## 上传流程图

```
┌─────────────┐     ┌─────────────────────────────────────────────────┐
│   Client    │     │                      Server                     │
└──────┬──────┘     └──────────────────────┬──────────────────────────┘
       │                                    │
       │  1. initChunkUpload               │
       │  {filename, fileSize, type, ...}  │
       │ ─────────────────────────────────►│
       │                                    │ 验证文件类型
       │                                    │ 生成 uploadId
       │                                    │ 创建临时目录
       │  {uploadId, chunkSize}            │
       │ ◄─────────────────────────────────│
       │                                    │
       │  2. uploadChunk (循环)            │
       │  {uploadId, chunkIndex, chunk}    │
       │ ─────────────────────────────────►│
       │                                    │ 保存分片到临时目录
       │  {chunkIndex, received: true}     │ 标记已接收
       │ ◄─────────────────────────────────│
       │        ↑                           │
       │        │ 更新进度条                │
       │        ↓                           │
       │    重复直到所有分片上传完成        │
       │                                    │
       │  3. completeChunkUpload           │
       │  {uploadId}                       │
       │ ─────────────────────────────────►│
       │                                    │ 检查分片完整性
       │                                    │ 合并分片
       │                                    │ 保存数据库
       │                                    │ 清理临时文件
       │  {id, path, type, size, ...}      │
       │ ◄─────────────────────────────────│
       │                                    │
```

## 文件大小限制说明

| 媒体类型 | 文件大小限制 | 上传方式 |
|----------|--------------|----------|
| IMAGE | 10MB | 普通上传 |
| LOGO | 10MB | 普通上传 |
| ADMIN_AVATAR | 10MB | 普通上传 |
| NEWS_COVER | 10MB | 普通上传 |
| PROJECT_COVER | 10MB | 普通上传 |
| **AUDIO** | **500MB** | ≤10MB 普通上传，>10MB 分片上传 |
| **VIDEO** | **500MB** | ≤10MB 普通上传，>10MB 分片上传 |

## 临时文件存储

```
project/
└── temp/
    └── chunks/
        └── {uploadId}/        # 每个上传会话的临时目录
            ├── chunk_0        # 第1个分片
            ├── chunk_1        # 第2个分片
            ├── chunk_2        # 第3个分片
            └── ...
```

上传完成后自动清理临时目录。

## 注意事项

1. **状态存储**: 当前使用内存 Map 存储上传状态，服务器重启会丢失进行中的上传。生产环境建议使用 Redis 持久化。

2. **并发上传**: 当前实现为串行上传分片，如需提升速度可改为并发上传（需注意并发数限制）。

3. **断点续传**: 当前未实现断点续传功能，上传中断需重新开始。

4. **过期清理**: 建议添加定时任务清理超时未完成的上传会话和临时文件。

## API 生成

API Client 由 `bwcx-api-client` 自动生成，新增的接口会自动添加到 `src/common/api/api-client.ts` 中：

- `this.$api.initChunkUpload()`
- `this.$api.uploadChunk()`
- `this.$api.completeChunkUpload()`
