with open('src/db/mockDb.ts', 'r') as f:
    content = f.read()

import re

old = """export function getTransactions(): Transaction[] {
  initializeDb();
  return getFromStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
}"""

new = """export function getTransactions(): Transaction[] {
  initializeDb();
  return getFromStorage<Transaction[]>('transactions', INITIAL_TRANSACTIONS);
}

export function deleteTransaction(id: string): void {
  const transactions = getTransactions();
  const filtered = transactions.filter(t => t.id !== id);
  saveToStorage('transactions', filtered);
}"""

if old in content:
    content = content.replace(old, new)
    with open('src/db/mockDb.ts', 'w') as f:
        f.write(content)
    print("Added deleteTransaction to mockDb.ts")
else:
    print("Could not find getTransactions in mockDb.ts")
