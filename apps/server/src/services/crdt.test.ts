import * as Y from 'yjs';

describe('Y.js CRDT Convergence Unit Tests', () => {
  it('should deterministically converge state updates on concurrent edits', () => {
    // Collaborator 1
    const doc1 = new Y.Doc();
    // Collaborator 2
    const doc2 = new Y.Doc();

    // Collaborators start with common text
    const text1 = doc1.getText('content');
    text1.insert(0, 'Hello World');

    // Sync baseline
    const updateBaseline = Y.encodeStateAsUpdate(doc1);
    Y.applyUpdate(doc2, updateBaseline);

    // Perform concurrent edits while offline
    doc1.getText('content').insert(5, ' Beautiful'); // "Hello Beautiful World"
    doc2.getText('content').insert(11, '!'); // "Hello World!"

    // Exchange updates (simulating reconnection)
    const update1 = Y.encodeStateAsUpdate(doc1);
    const update2 = Y.encodeStateAsUpdate(doc2);

    Y.applyUpdate(doc1, update2);
    Y.applyUpdate(doc2, update1);

    // Verify identical convergence content
    const result1 = doc1.getText('content').toString();
    const result2 = doc2.getText('content').toString();

    expect(result1).toEqual(result2);
    expect(result1).toContain('Beautiful');
    expect(result1).toContain('!');
  });

  it('should handle concurrent insertions and deletions gracefully without throwing', () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const text1 = doc1.getText('content');
    text1.insert(0, 'ABCD');
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    // Client 1 deletes "BC"
    doc1.getText('content').delete(1, 2); // "AD"

    // Client 2 inserts "X" between "B" and "C" (pos 2)
    doc2.getText('content').insert(2, 'X'); // "ABXD"

    // Sync
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    expect(doc1.getText('content').toString()).toEqual(doc2.getText('content').toString());
  });
});
