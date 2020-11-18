interface SomeInterface {
  x: number;
  y: number;
}

describe('suite', () => {
  it('fails with source-maps', () => {
    throw new Error('failure from line 8');
  });
});
