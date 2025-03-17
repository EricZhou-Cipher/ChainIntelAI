export const getTransactions = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: [
        { hash: '0xabc', from: '0x123', to: '0x456', value: '1.0' },
        { hash: '0xdef', from: '0x789', to: '0x123', value: '2.5' }
      ]
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: '服务器错误' });
  }
};
