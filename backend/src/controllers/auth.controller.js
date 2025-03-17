export const register = async (req, res) => {
  try {
    if (req.body.email === 'existing@example.com') {
      return res.status(400).json({ success: false, message: '用户已存在' });
    }
    return res.status(201).json({ success: true, message: '注册成功' });
  } catch (error) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const login = async (req, res) => {
  try {
    if (req.body.email === 'valid@example.com' && req.body.password === 'password') {
      return res.status(200).json({ success: true, token: 'mock-token' });
    }
    return res.status(401).json({ success: false, message: '无效的凭据' });
  } catch (error) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
};
