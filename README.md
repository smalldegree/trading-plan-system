# 交易计划记录系统

一个面向个人投资者的交易计划记录与复盘系统，帮助你有计划地交易、记录每一次买卖并复盘盈亏。

## 功能特性

- **用户体系**：注册、登录、修改密码（JWT 鉴权）
- **交易记录管理**：新增 / 编辑 / 删除 / 分页 / 搜索（公司、代码、原因、总结）/ 日期范围筛选
- **日历日期选择**：买入 / 卖出日期使用日期选择器
- **自动计算**：买入金额、卖出金额、盈亏金额、收益率、优选打分自动生成
- **统计面板**：总收益率、总盈亏、胜率、盈亏比、平均持仓、总买入 / 卖出金额、持仓金额、策略因子胜率分析、收益金额曲线、盈利 / 亏损 Top5、自定义统计时间段
- **数据导入导出**：CSV 导入 / 导出
- **主题切换**：简易风 / 科技风 / 奢华风 三套主题
- **可折叠侧边栏**：收起后为中间页面腾出更多展示空间

## 技术栈

### 前端（`web/`）

| 技术 | 说明 |
|------|------|
| Vue 3 | Composition API |
| Vite | 构建工具与开发服务器 |
| Pinia | 状态管理（登录态 / 主题） |
| Vue Router | 路由 |
| Element Plus | UI 组件库 |
| ECharts | 收益曲线等图表 |
| Axios | HTTP 请求 |
| dayjs | 日期处理 |

### 后端（`server/`）

| 技术 | 说明 |
|------|------|
| Node.js + Express | HTTP 服务 |
| Knex.js | 数据库中间件（可切换数据库） |
| better-sqlite3 | 当前使用的 SQLite 数据库 |
| jsonwebtoken + bcryptjs | JWT 鉴权与密码加密 |
| cors / dotenv | 跨域与环境变量 |

## 目录结构

```
trading-plan-system/
├── web/                        # 前端
│   ├── src/
│   │   ├── api/                # Axios 封装
│   │   ├── components/         # 布局、表格、统计面板、交易表单弹窗
│   │   ├── router/             # 路由配置
│   │   ├── store/              # Pinia（auth / theme）
│   │   ├── styles/             # 全局样式与主题变量
│   │   ├── utils/              # 格式化工具
│   │   └── views/              # 登录、注册、交易计划、设置页面
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── server/                     # 后端
    ├── src/
    │   ├── config.js           # 端口 / JWT / 数据库配置
    │   ├── db.js               # Knex 实例
    │   ├── app.js              # Express 应用与路由挂载
    │   ├── server.js           # 入口（启动时自动迁移）
    │   ├── middleware/auth.js  # JWT 鉴权中间件
    │   ├── routes/             # auth / trades 路由
    │   └── utils/csv.js        # CSV 解析与生成
    ├── migrations/             # 数据库迁移文件
    ├── knexfile.js             # Knex CLI 配置
    └── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18

### 1. 启动后端

```bash
cd server
npm install
npm run dev        # 开发模式（自动重启），默认监听 http://localhost:3000
```

### 2. 启动前端

```bash
cd web
npm install
npm run dev        # 默认监听 http://localhost:5173
```

前端开发服务器已将 `/api` 请求代理到 `http://localhost:3000`。

启动后打开浏览器访问：<http://localhost:5173>，注册账号后即可使用。

### 生产构建

```bash
# 前端
cd web
npm run build      # 产物输出到 web/dist

# 后端
cd server
npm start          # 使用 node 直接启动
```

## 部署（Ubuntu 24.04 + Nginx + MySQL）

以下以 Ubuntu 24.04 为例，将系统部署到生产环境。

### 1. 安装依赖

```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx
sudo apt-get install -y nginx

# MySQL
sudo apt-get install -y mysql-server

# PM2（Node 进程守护）
sudo npm install -g pm2
```

### 2. 准备 MySQL 数据库

```bash
sudo mysql -e "CREATE DATABASE trading_plan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'trading'@'localhost' IDENTIFIED BY '改成你的密码';"
sudo mysql -e "GRANT ALL PRIVILEGES ON trading_plan.* TO 'trading'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
```

### 3. 部署后端

```bash
cd /opt/trading-plan-system/server
npm install --omit=dev
npm install mysql2        # MySQL 驱动

# 创建环境变量配置
cat > .env <<'EOF'
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=trading
DB_PASSWORD=改成你的密码
DB_NAME=trading_plan
JWT_SECRET=请改成随机长字符串
PORT=3000
EOF

# 启动（启动时会自动执行数据库迁移）
pm2 start src/server.js --name trading-plan-server
pm2 save
pm2 startup
```

### 4. 部署前端

```bash
cd /opt/trading-plan-system/web
npm install
npm run build        # 产物输出到 web/dist
```

### 5. 配置 Nginx

创建 `/etc/nginx/sites-available/trading-plan`：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    # 前端静态资源
    root /opt/trading-plan-system/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;   # 支持前端路由
    }

    # 后端 API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/trading-plan /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. 验证与更新

浏览器访问 `http://你的域名或IP`，注册账号后即可使用。若前端路由刷新出现 404，确认 Nginx 的 `try_files` 配置已启用。

后续更新代码：

```bash
git pull
cd server && npm install && pm2 restart trading-plan-server
cd web && npm install && npm run build
```

## 配置（后端环境变量）

后端通过 `.env` 文件或环境变量配置（`server/src/config.js`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 后端端口 |
| `DB_CLIENT` | `better-sqlite3` | 数据库客户端：`better-sqlite3` / `sqlite3` / `mysql` / `mysql2` / `pg` |
| `DB_FILENAME` | `server/data/trading.sqlite` | SQLite 数据库文件路径 |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | — | MySQL / PostgreSQL 连接信息 |
| `JWT_SECRET` | `dev-secret-change-me` | JWT 密钥（生产环境务必修改） |
| `JWT_EXPIRES_IN` | `7d` | Token 有效期 |

> 通过 `DB_CLIENT` 即可切换数据库，无需改动业务代码（Knex 中间件负责适配）。
>
> `server/knexfile.js` 中显式定义了 `sqlite`（默认）与 `mysql` 两套连接配置，供 `knex migrate:*` CLI 使用；设置 `DB_CLIENT=mysql` 或 `DB_CLIENT=mysql2` 即切换到 MySQL，切换前需先安装 `mysql2` 驱动（`npm i mysql2`）。

## 数据库

使用 Knex 迁移管理表结构，后端启动时自动执行迁移：

```bash
cd server
npm run migrate         # 手动执行迁移
npm run migrate:rollback # 回滚最近一次迁移
```

### 数据表

- **users**：`id`、`username`、`password_hash`、`created_at`、`updated_at`
- **trades**：`id`、`user_id`、`trade_date`、`stock_name`、`stock_code`、`point`、`strong_reversal`、`position_preferred`、`pullback_sufficient`、`score`、`price`、`shares`、`buy_amount`、`sell_date`、`sell_price`、`sell_shares`、`sell_amount`、`trend`、`reason`、`return_rate`、`pnl`、`summary`、`status`、`remark`、`created_at`、`updated_at`

## API 接口

### 认证（`/api/auth`）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/register` | 注册 |
| POST | `/login` | 登录 |
| GET | `/me` | 获取当前用户（需鉴权） |
| POST | `/change-password` | 修改密码（需鉴权） |

### 交易记录（`/api/trades`，均需鉴权）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 分页列表（`page`、`pageSize`、`keyword`、`start_date`、`end_date`） |
| GET | `/stats` | 统计（收益率、曲线、盈利/亏损、Top5、策略因子胜率、盈亏比、持仓金额等） |
| GET | `/export` | 导出 CSV |
| POST | `/import` | 导入 CSV |
| GET | `/:id` | 记录详情 |
| POST | `/` | 新增 |
| PUT | `/:id` | 更新 |
| DELETE | `/:id` | 删除 |

### 其他

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |

## CSV 导入导出

CSV 表头支持中文列名或字段名，例如：`公司,代码,取点,强扭转,位置优选,回踩充分,优选打分,买入日期,买入价格,买入股数,买入金额,卖出日期,卖出价格,卖出股数,卖出金额,走势,原因,收益率,盈亏金额,总结`。

导入时会自动计算买入金额、卖出金额、盈亏金额、收益率与优选打分。
