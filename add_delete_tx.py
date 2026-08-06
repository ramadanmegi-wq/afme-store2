with open('src/db/mockDb.ts', 'r') as f:
    content = f.read()

import re

old = """export function saveTransaction(trx: Transaction): void {
  const transactions = getTransactions();
  transactions.push(trx);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}"""

new = """export function saveTransaction(trx: Transaction): void {
  const transactions = getTransactions();
  transactions.push(trx);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function deleteTransaction(id: string): void {
  const transactions = getTransactions();
  const filtered = transactions.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
}"""

if old in content:
    content = content.replace(old, new)
    with open('src/db/mockDb.ts', 'w') as f:
        f.write(content)
    print("Added deleteTransaction to mockDb.ts")
else:
    print("Could not find saveTransaction in mockDb.ts")
