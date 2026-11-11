const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const tradeRoutes = require('./routes/trades');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/trades', tradeRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 统一错误处理
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: '服务器内部错误' });
});

module.exports = app;
