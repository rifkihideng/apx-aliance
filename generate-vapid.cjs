// Skrip untuk membuat pasangan VAPID key baru (web push).
// Jalankan: node generate-vapid.cjs
//
// Output public & private key yang baru. Tempel:
//   - Public Key  -> src/lib/push-config.ts  (VAPID_PUBLIC_KEY)
//   - Private Key -> .env.local (VAPID_PRIVATE_KEY) + Vercel Environment Variables
//
// CATATAN: setelah key diganti, semua subscriber push lama harus subscribe ulang.

const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();

console.log("");
console.log("==================================================");
console.log(" VAPID Keys Baru");
console.log("==================================================");
console.log("Public Key (untuk VAPID_PUBLIC_KEY):");
console.log(keys.publicKey);
console.log("");
console.log("Private Key (untuk VAPID_PRIVATE_KEY):");
console.log(keys.privateKey);
console.log("");
console.log("Subjek (VAPID_SUBJECT, opsional): mailto:admin@apx-alliance.local");
console.log("==================================================");
