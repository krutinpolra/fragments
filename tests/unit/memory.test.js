const MemoryDataStore = require('../../src/model/data/memory/index');

describe('MemoryDataStore', () => {
  const ownerId = 'user123';
  const fragmentId = 'test-fragment';
  const sampleFragment = {
    id: fragmentId,
    ownerId: ownerId,
    type: 'text/plain',
    size: 12,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
  const sampleData = Buffer.from('Hello, world!');

  // Test writing and reading fragment metadata
  test('should write and read fragment metadata', async () => {
    await MemoryDataStore.writeFragment(sampleFragment);
    const result = await MemoryDataStore.readFragment(ownerId, fragmentId);
    expect(result).toEqual(sampleFragment);
  });

  // Test handling of non-existent fragment metadata
  test('should return undefined for non-existent fragment', async () => {
    const result = await MemoryDataStore.readFragment(ownerId, 'non-existent-id');
    expect(result).toBeUndefined();
  });

  // Test writing and reading fragment data
  test('should write and read fragment data', async () => {
    await MemoryDataStore.writeFragmentData(ownerId, fragmentId, sampleData);
    const result = await MemoryDataStore.readFragmentData(ownerId, fragmentId);
    expect(result).toEqual(sampleData);
  });

  // Test handling of non-existent fragment data
  test('should return undefined for non-existent fragment data', async () => {
    const result = await MemoryDataStore.readFragmentData(ownerId, 'non-existent-id');
    expect(result).toBeUndefined();
  });

  // Test listing fragments with metadata
  test('should list fragment IDs', async () => {
    await MemoryDataStore.writeFragment(sampleFragment);
    const result = await MemoryDataStore.listFragments(ownerId);
    expect(result).toContain(fragmentId);
  });

  // Test listing fragments with expanded metadata
  test('should list full fragment objects when expand=true', async () => {
    const result = await MemoryDataStore.listFragments(ownerId, true);
    expect(result).toEqual(expect.arrayContaining([sampleFragment]));
  });

  // Test deleting a fragment
  test('should delete fragment metadata and data', async () => {
    await MemoryDataStore.writeFragment(sampleFragment);
    await MemoryDataStore.writeFragmentData(ownerId, fragmentId, sampleData);

    await MemoryDataStore.deleteFragment(ownerId, fragmentId);

    const metaResult = await MemoryDataStore.readFragment(ownerId, fragmentId);
    const dataResult = await MemoryDataStore.readFragmentData(ownerId, fragmentId);
    expect(metaResult).toBeUndefined();
    expect(dataResult).toBeUndefined();
  });
});
