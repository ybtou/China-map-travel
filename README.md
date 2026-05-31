# China-map-travel
一个记录旅行的网页，由AI编写
## 快速开始

### 1. 申请高德地图 API

本项目需要使用高德地图 API，请按以下步骤申请：

#### 第一步：注册高德开放平台账号

访问 [高德开放平台](https://console.amap.com/)，注册并登录账号。

#### 第二步：创建应用

1. 登录后进入 [应用管理控制台](https://console.amap.com/dev/key/app)

### 2. 配置环境变量

项目根目录下有 `.env.example` 文件，复制并重命名为 `.env`：

```bash
cp .env.example .env
```
然后编辑 `.env` 文件，填入你的密钥：

# 高德地图 API Key
VITE_AMAP_KEY=你的API密钥

# 高德地图安全密钥 (securityJsCode)
VITE_AMAP_SECURITY_CODE=你的安全密钥


### 3. 安装依赖

```bash
npm install

### 4. 启动项目
