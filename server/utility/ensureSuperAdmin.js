import bcrypt from "bcrypt";
import User from "../models/users.js";
import mongoose from "mongoose";

const ensureSuperAdmin = async () => {
  try {
    const exists = await User.findOne({ role: "superAdmin" });
    if (exists) {
      console.log("✅ SuperAdmin already exists:", exists.sapId);
      return;
    }

    // const hashed = await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 10);

    const superAdmin = new User({
      name: process.env.SUPERADMIN_NAME || "SuperAdmin",
      email: process.env.SUPERADMIN_EMAIL,
      sapId: process.env.SUPERADMIN_SAPID || "000000",
      
      // departmentId & sectionId not required for superAdmin
      
      role: "superAdmin",
      password: process.env.SUPER_ADMIN_PASSWORD || "superadmin123", // default password if not set in env
    });

    await superAdmin.save();
    console.log("🚀 SuperAdmin created:", superAdmin.email);
  } catch (err) {
    console.error("❌ Error ensuring superAdmin:", err);
  }
};

export default ensureSuperAdmin;
