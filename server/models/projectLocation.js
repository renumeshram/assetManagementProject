import mongoose from "mongoose";

const projectLocationSchema = new mongoose.Schema({
    location: {
        type: String,
        required: true,
    }
})

export default mongoose.model("ProjectLocation", projectLocationSchema);