const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const auth = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function publicUser(user) {
  return { id: user.id, username: user.username };
}

// 注册
router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const name = String(username || '').trim();
    if (!name || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: '用户名长度需在 2-50 个字符之间' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: '密码至少 6 位' });
    }
    const exists = await db('users').where({ username: name }).first();
    if (exists) {
      return res.status(409).json({ message: '用户名已存在' });
    }
    const hash = await bcrypt.hash(String(password), 10);
    const [id] = await db('users').insert({ username: name, password_hash: hash });
    const user = await db('users').where({ id }).first();
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    return next(e);
  }
});

// 登录
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const name = String(username || '').trim();
    if (!name || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    const user = await db('users').where({ username: name }).first();
    if (!user || !(await bcrypt.compare(String(password), user.password_hash))) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (e) {
    return next(e);
  }
});

// 当前用户信息
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ message: '用户不存在' });
    return res.json({ user: publicUser(user) });
  } catch (e) {
    return next(e);
  }
});

// 修改密码
router.post('/change-password', auth, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: '原密码和新密码不能为空' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: '新密码至少 6 位' });
    }
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if (!(await bcrypt.compare(String(oldPassword), user.password_hash))) {
      return res.status(400).json({ message: '原密码错误' });
    }
    const hash = await bcrypt.hash(String(newPassword), 10);
    await db('users')
      .where({ id: req.user.id })
      .update({ password_hash: hash, updated_at: new Date() });
    return res.json({ message: '密码修改成功' });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
