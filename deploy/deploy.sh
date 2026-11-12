#!/usr/bin/env bash
# 交易计划记录系统部署脚本（Ubuntu 24.04 + Nginx + MySQL + Node.js）
# 用法：sudo bash deploy/deploy.sh
# 全新部署：默认清理 node_modules / dist 等旧环境残留，不清除数据库数据
# 如需连数据库一起重建：CLEAN_DB=1 sudo bash deploy/deploy.sh
#
# 可用环境变量覆盖默认值：
#   DOMAIN       访问域名（默认 your-domain.com）
#   PORT         后端端口（默认 3000）
#   DB_NAME      数据库名（默认 trading_plan）
#   DB_USER      数据库用户（默认 trading）
#   DB_PASSWORD  数据库密码（默认 please-change-me）
#   JWT_SECRET   JWT 密钥（默认随机生成）

set -euo pipefail

# 部署根目录（自动检测脚本位置：脚本位于 <project>/deploy/deploy.sh，也可用 APP_ROOT 覆盖）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="${APP_ROOT:-$(dirname "$SCRIPT_DIR")}"
APP_PLACEHOLDER="/var/www/html/trading-plan-system"

DOMAIN="${DOMAIN:-your-domain.com}"
PORT="${PORT:-3000}"
DB_NAME="${DB_NAME:-trading_plan}"
DB_USER="${DB_USER:-trading}"
DB_PASSWORD="${DB_PASSWORD:-please-change-me}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32 2>/dev/null || tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)}"

# 0. 清理旧环境（全新部署，不留上次残留）
echo "==> 0. 清理旧环境"
rm -rf "$APP_ROOT/server/node_modules"
rm -rf "$APP_ROOT/web/node_modules"
rm -rf "$APP_ROOT/web/dist"

# 1. 准备 MySQL 数据库（默认保留已有数据，CLEAN_DB=1 时重建）
echo "==> 1. 准备 MySQL 数据库"
if [ "${CLEAN_DB:-0}" = "1" ]; then
    echo "==> 重建数据库（CLEAN_DB=1）"
    mysql -e "DROP DATABASE IF EXISTS ${DB_NAME};"
fi
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# 2. 安装后端依赖并写入环境变量
echo "==> 2. 安装后端依赖"
cd "$APP_ROOT/server"
npm install
npm install mysql2 --no-save

cat > "$APP_ROOT/server/.env" <<EOF
DB_CLIENT=mysql2
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
PORT=${PORT}
EOF

# 3. 数据库迁移
echo "==> 3. 数据库迁移"
npm run migrate

# 4. 构建前端
echo "==> 4. 构建前端"
cd "$APP_ROOT/web"
npm install
npm run build

# 5. 安装 systemd 服务
echo "==> 5. 安装 systemd 服务"
cp "$APP_ROOT/deploy/trading-plan.service" /etc/systemd/system/trading-plan.service
sed -i "s|${APP_PLACEHOLDER}|${APP_ROOT}|g" /etc/systemd/system/trading-plan.service
NODE_BIN="$(command -v node)"
sed -i "s|/usr/bin/node|${NODE_BIN}|g" /etc/systemd/system/trading-plan.service
systemctl daemon-reload
systemctl enable --now trading-plan.service

# 6. 安装 Nginx 站点配置（sites-available / sites-enabled 方式）
echo "==> 6. 安装 Nginx 站点配置"
cp "$APP_ROOT/deploy/nginx/trading-plan.conf" /etc/nginx/sites-available/trading-plan
sed -i "s|${APP_PLACEHOLDER}|${APP_ROOT}|g" /etc/nginx/sites-available/trading-plan
sed -i "s|127.0.0.1:3000|127.0.0.1:${PORT}|g" /etc/nginx/sites-available/trading-plan
sed -i "s|your-domain.com|${DOMAIN}|g" /etc/nginx/sites-available/trading-plan
ln -sf /etc/nginx/sites-available/trading-plan /etc/nginx/sites-enabled/trading-plan
nginx -t && systemctl reload nginx

echo "==> 部署完成"
echo "访问地址：http://${DOMAIN}"
echo "后端服务：systemctl status trading-plan"
echo "提示：如需 SSL 证书，请执行：certbot --nginx -d ${DOMAIN}"
