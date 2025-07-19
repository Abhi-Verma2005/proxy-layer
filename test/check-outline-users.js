import { outlineDb } from '../src/integrations/outline/client.ts';
import { users as outlineUsersTable } from '../src/integrations/outline/schema.ts';

async function checkOutlineUsers() {
  console.log('🔍 Checking Outline database users...');
  
  try {
    // Get all users from Outline database
    const allUsers = await outlineDb.select().from(outlineUsersTable);
    
    console.log(`📊 Found ${allUsers.length} users in Outline database:`);
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Check for specific email
    const targetEmail = 'abhishek.verma2024@nst.rishihood.edu.in';
    console.log(`🔍 Looking for email: ${targetEmail}`);
    
    const matchingUsers = allUsers.filter(user => 
      user.email && user.email.toLowerCase() === targetEmail.toLowerCase()
    );
    
    if (matchingUsers.length > 0) {
      console.log(`✅ Found ${matchingUsers.length} matching user(s):`);
      matchingUsers.forEach(user => {
        console.log(`   ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
      });
    } else {
      console.log(`❌ No users found with email: ${targetEmail}`);
      
      // Show similar emails
      const similarEmails = allUsers.filter(user => 
        user.email && user.email.includes('abhishek')
      );
      
      if (similarEmails.length > 0) {
        console.log(`🔍 Similar emails found:`);
        similarEmails.forEach(user => {
          console.log(`   ${user.email}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Error checking Outline users:', error);
  }
}

checkOutlineUsers().catch(console.error); 