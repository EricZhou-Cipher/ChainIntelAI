export const replayEvents = jest.fn().mockImplementation(() => {
  return { processed: 100, duration: 1000 };
});
