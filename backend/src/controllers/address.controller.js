export const getAddresses = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: [
        { address: '0x123', riskScore: 0.8 },
        { address: '0x456', riskScore: 0.3 }
      ]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
};
