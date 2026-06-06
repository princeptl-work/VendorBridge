const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/vrajp/CodingFiles/VS Codes/odoo/backend/.env' });
const User = require('c:/Users/vrajp/CodingFiles/VS Codes/odoo/backend/models/User');
const Vendor = require('c:/Users/vrajp/CodingFiles/VS Codes/odoo/backend/models/Vendor');

async function checkOrphanedVendors() {
  console.log('Connecting to database...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected!');

  const vendorUsers = await User.find({ role: 'vendor' }).populate('vendorId');
  console.log(`Found ${vendorUsers.length} total user accounts with role 'vendor':`);
  
  let orphansCount = 0;
  for (const u of vendorUsers) {
    if (!u.vendorId) {
      console.log(`❌ User: ${u.name} (${u.email}) has NO linked vendorId!`);
      orphansCount++;
    } else {
      const vendorDoc = await Vendor.findById(u.vendorId._id);
      if (!vendorDoc) {
        console.log(`❌ User: ${u.name} (${u.email}) is linked to vendorId ${u.vendorId._id} which DOES NOT EXIST in the database!`);
        orphansCount++;
      } else {
        console.log(`✅ User: ${u.name} (${u.email}) is correctly linked to Vendor: ${vendorDoc.name} (${vendorDoc.email})`);
      }
    }
  }

  console.log(`Total orphaned vendor users: ${orphansCount}`);
  await mongoose.disconnect();
}

checkOrphanedVendors().catch(err => {
  console.error(err);
  process.exit(1);
});
