import mongoose from "mongoose";

const ownerRegistrationSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("OwnerRegistration", ownerRegistrationSchema);
