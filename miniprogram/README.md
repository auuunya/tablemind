# TableMind 微信小程序版本

基于 Taro 3.x 框架开发的 TableMind 微信小程序版本，支持 Excel 数据对比分析。

## 技术栈

- **框架**: Taro 3.6+
- **UI库**: NutUI (京东移动端组件库)
- **语言**: TypeScript
- **状态管理**: React Hooks
- **编译**: Webpack 5

## 快速开始

### 1. 安装依赖

```bash
cd miniprogram
npm install
```

### 2. 开发模式

```bash
# 微信小程序
npm run dev:weapp

# 支付宝小程序
npm run dev:alipay

# H5
npm run dev:h5
```

### 3. 生产构建

```bash
npm run build:weapp
```

### 4. 微信开发者工具

1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录选择 `miniprogram/dist`
4. AppID 填写你的小程序 AppID

## 项目结构

```
miniprogram/
├── src/
│   ├── app.config.ts       # 全局配置
│   ├── app.tsx             # 入口组件
│   ├── app.scss            # 全局样式
│   ├── pages/              # 页面
│   │   ├── index/          # 首页
│   │   ├── compare/        # 对比配置
│   │   └── result/         # 结果展示
│   ├── components/         # 组件
│   │   ├── FileUpload/     # 文件上传
│   │   ├── SheetSelector/  # 工作表选择
│   │   ├── ColumnMapper/   # 列映射
│   │   └── DiffViewer/     # 差异查看
│   ├── utils/              # 工具函数
│   │   ├── excel.ts        # Excel 处理
│   │   └── diff.ts         # 对比逻辑
│   └── types/              # 类型定义
├── config/                 # Taro 配置
├── project.config.json     # 小程序配置
└── package.json
```

## 功能特性

### ✅ 已实现
- 文件上传（支持 .xlsx/.xls）
- 工作表选择
- 列映射配置
- 数据对比
- 结果筛选和展示

### 🚧 开发中
- 结果导出
- 数据缓存
- 分享功能

### 📋 计划中
- 历史记录
- 模板保存
- 云端同步

## 小程序限制

由于微信小程序的限制，以下功能有调整：

1. **文件大小**: 建议单个文件 < 10MB
2. **数据量**: 建议总行数 < 5000 行
3. **文件来源**: 
   - 聊天文件
   - 手机相册（需转换）
   - 云存储

## 开发说明

### 复用 Web 代码

大部分业务逻辑从 Web 版本复用：

```typescript
// Web 版本
import { generateDiff } from '@/lib/excel'

// 小程序版本（相同代码）
import { generateDiff } from '@/utils/excel'
```

### 小程序特定适配

```typescript
// 文件选择
import Taro from '@tarojs/taro'

const chooseFile = () => {
  Taro.chooseMessageFile({
    count: 5,
    type: 'file',
    extension: ['xlsx', 'xls']
  })
}
```

## 注意事项

1. **ExcelJS 兼容性**: 已测试，完全兼容小程序环境
2. **内存限制**: 大文件需要分片处理
3. **网络请求**: 所有处理在本地完成，无需服务器

## License

MIT
