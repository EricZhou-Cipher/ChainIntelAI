export default {
  findOne: jest.fn().mockImplementation((query) => {
    if (query.email === 'existing@example.com') {
      return { _id: '123', email: 'existing@example.com', password: 'hashedpassword' };
    }
    return null;
  }),
  create: jest.fn().mockImplementation((data) => ({ _id: '456', ...data }))
};
