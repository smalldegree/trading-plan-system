const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ message: '未登录或登录已过期' });
  }
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    return next();
  } catch (e) {
    return res.status(401).json({ message: '未登录或登录已过期' });
  }
};
