import { StreamChat } from "stream-chat";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

const userSchema = new mongoose.Schema({ fullName: String });
const User = mongoose.model("User", userSchema);

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const serverClient = StreamChat.getInstance(apiKey, apiSecret);

  const users = await User.find({}).select("_id fullName").lean();
  console.log(`Found ${users.length} users`);

  const streamUsers = users.map((u) => ({
    id: u._id.toString(),
    name: u.fullName || "User",
    role: "user",
  }));

  const BATCH = 100;
  for (let i = 0; i < streamUsers.length; i += BATCH) {
    await serverClient.upsertUsers(streamUsers.slice(i, i + BATCH));
    console.log(`Upserted batch ${i / BATCH + 1}`);
  }

  console.log(`✅ Synced ${users.length} users to Stream app ${apiKey}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
