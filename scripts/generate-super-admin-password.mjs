import bcrypt from 'bcryptjs';

// Generate a random 12-character password
function generateRandomPassword() {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function main() {
    const password = generateRandomPassword();
    const hash = await bcrypt.hash(password, 10);

    console.log('\n🔐 SUPER ADMIN PASSWORD GENERATED\n');
    console.log('Password:', password);
    console.log('\nHashed:', hash);
    console.log('\n📋 Run this SQL in Supabase SQL Editor:\n');
    console.log(`UPDATE super_admin SET password_hash = '${hash}' WHERE username = 'super-admin';\n`);
    console.log('✅ After running the SQL, you can login at /login with:');
    console.log('   Username: super-admin');
    console.log('   Password:', password);
    console.log('\n⚠️  SAVE THIS PASSWORD NOW - It won\'t be shown again!\n');
}

main().catch(console.error);
