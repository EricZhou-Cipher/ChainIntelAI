export const protect = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  
  if (token === 'mock-token') {
    req.user = { id: '123', email: 'user@example.com' };
    return next();
  }
  
  return res.status(401).json({ success: false, message: '无效的令牌' });
};
