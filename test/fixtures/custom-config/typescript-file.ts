describe('suite', () => {
  it('passes when transpiled with typescript', () => {
    const someText: string = 'this line fails without loader';
    if (someText !== someText) {
      throw new Error('should never happen');
    }
  });
});
