sed -i 's/generateUUID()/`prod-${Date.now()}`/g' src/components/IPhoneStock.tsx
sed -i 's/generateUUID()/`srv-${Date.now()}`/g' src/components/ServiceHP.tsx
sed -i 's/generateUUID()/`sp-${Date.now()}`/g' src/components/SparepartsInventory.tsx
sed -i 's/generateUUID()/`trx-${Date.now()}`/g' src/components/POS.tsx
sed -i 's/generateUUID()/`cust-${Date.now()}`/g' src/components/CustomerRoster.tsx
sed -i 's/generateUUID()/`exp-${Date.now()}`/g' src/App.tsx
sed -i 's/generateUUID()/`cust-${Date.now()}`/g' src/App.tsx
sed -i '/import { generateUUID } from/d' src/components/IPhoneStock.tsx
sed -i '/import { generateUUID } from/d' src/components/ServiceHP.tsx
sed -i '/import { generateUUID } from/d' src/components/SparepartsInventory.tsx
sed -i '/import { generateUUID } from/d' src/components/POS.tsx
sed -i '/import { generateUUID } from/d' src/components/CustomerRoster.tsx
sed -i '/import { generateUUID } from/d' src/App.tsx
