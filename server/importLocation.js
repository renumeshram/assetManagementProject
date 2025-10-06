import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import ProjectLocation from "./models/projectLocation.js";
import Department from "./models/department.js";
import Section from "./models/section.js";

dotenv.config();

const importData = async () => {
  try {
    // connect to Mongo
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // load JSON
    const dataPath = path.resolve("./data/location.json");
    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    // clear old data
    await Promise.all([ProjectLocation.deleteMany(), Department.deleteMany(), Section.deleteMany()]);

    for (const loc of data.locations) {
      // create location
      const locationDoc = await ProjectLocation.create({ location: loc.name });

      for (const dept of loc.departments) {
        // create department
        const deptDoc = await Department.create({
          name: dept.name,
          locationId: locationDoc._id,
        });

        // create sections
        for (const sec of dept.sections) {
          const secDoc = await Section.create({
            name: sec,
            departmentId: deptDoc._id,
          });
        //   deptDoc.sections.push(secDoc._id);
        }

        await deptDoc.save();
        // locationDoc.departments.push(deptDoc._id);
      }

      await locationDoc.save();
    }

    console.log("🎉 Import finished successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Import error:", err);
    process.exit(1);
  }
};

importData();
