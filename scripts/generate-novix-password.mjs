import bcrypt from 'bcryptjs';

// Generate a secure password for Novix manager
const password = 'Novix@2026!Secure';  // Change this to your desired password
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
        console.error('Error generating hash:', err);
        return;
    }

    console.log('\n✅ ============================================');
    console.log('✅ NOVIX MANAGER PASSWORD GENERATED');
    console.log('✅ ============================================\n');
    console.log('Password:', password);
    console.log('\nBcrypt Hash:');
    console.log(hash);
    console.log('\n📋 SQL Command to set password:\n');
    console.log(`UPDATE novix_managers`);
    console.log(`SET password_hash = '${hash}'`);
    console.log(`WHERE username = 'novix-admin';`);
    console.log('\n✅ ============================================\n');
});
