sed -i 's/`prod-${Date.now()}`/generateUUID()/g' src/components/IPhoneStock.tsx
sed -i 's/`srv-${Date.now()}`/generateUUID()/g' src/components/ServiceHP.tsx
sed -i 's/`sp-${Date.now()}`/generateUUID()/g' src/components/SparepartsInventory.tsx
sed -i 's/`trx-${Date.now()}`/generateUUID()/g' src/components/POS.tsx
sed -i 's/`cust-${Date.now()}`/generateUUID()/g' src/components/CustomerRoster.tsx
sed -i 's/`exp-${Date.now()}`/generateUUID()/g' src/App.tsx
sed -i 's/`cust-${Date.now()}`/generateUUID()/g' src/App.tsx
sed -i 's/`acc-${Date.now()}`/generateUUID()/g' src/components/Pengaturan.tsx

# Add imports
sed -i '1s/^/import { generateUUID } from "..\/lib\/uuid";\n/' src/components/IPhoneStock.tsx
sed -i '1s/^/import { generateUUID } from "..\/lib\/uuid";\n/' src/components/ServiceHP.tsx
sed -i '1s/^/import { generateUUID } from "..\/lib\/uuid";\n/' src/components/SparepartsInventory.tsx
sed -i '1s/^/import { generateUUID } from "..\/lib\/uuid";\n/' src/components/POS.tsx
sed -i '1s/^/import { generateUUID } from "..\/lib\/uuid";\n/' src/components/CustomerRoster.tsx
sed -i '1s/^/import { generateUUID } from "..\/lib\/uuid";\n/' src/components/Pengaturan.tsx
sed -i '1s/^/import { generateUUID } from ".\/lib\/uuid";\n/' src/App.tsx
