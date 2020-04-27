import { expect } from 'chai';

describe('suite', () => {
  it('passes when json file is served', async () => {
    const response = await fetch('asset.json');
    expect(response.status).to.equal(200);
    expect(await response.json()).to.equal('asset is served');
  });
});
