import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import Asset from "./models/asset.js";
import AssetCategory from "./models/assetCategory.js";

dotenv.config();

const importAssets = async () => {
  try {
    // connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL);
    console.log("✅ Connected to MongoDB");

    // load JSON file
    const dataPath = path.resolve("./data/asset.json"); // file should be inside /data
    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

    // clear old data
    await Promise.all([Asset.deleteMany(), AssetCategory.deleteMany()]);

    for (const cat of data.categories) {
      // create category
      const categoryDoc = await AssetCategory.create({
        categoryName: cat.categoryName,
      });

      // create assets under this category
      for (const asset of cat.assets) {
        await Asset.create({
          assetName: asset.assetName,
          categoryId: categoryDoc._id,
          make: asset.make,
          model: asset.model,
          unitWeight: asset.unitWeight,
          isEwaste: asset.isEwaste || false,
        });
      }
    }

    console.log("🎉 Assets import finished successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Import error:", err);
    process.exit(1);
  }
};

importAssets();
