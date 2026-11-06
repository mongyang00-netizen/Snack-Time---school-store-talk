import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import fs from "fs";
import path from "path";

const AUDIO_DIR = path.resolve("./public/audio");
fs.mkdirSync(AUDIO_DIR, { recursive: true });

const DIALOGUES = [
  {
    id: 1,
    clerk: "Hi! What would you like?",
    target: "Can I have a sandwich, please?",
  },
  {
    id: 2,
    clerk: "Sure! Anything else?",
    target: "An apple juice, please.",
  },
  {
    id: 3,
    clerk: "Here you go!",
    target: "How much is it?",
  },
  {
    id: 4,
    clerk: "It's four dollars.",
    target: "Here you are.",
  },
  {
    id: 5,
    clerk: "Thank you! Have a nice day!",
    target: "Thank you! Bye!",
  },
];

async function generateAll() {
  console.log("Starting audio generation with msedge-tts (en-US-JennyNeural)...");
  const tts = new MsEdgeTTS();
  await tts.setMetadata("en-US-JennyNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const tempDir = path.resolve("./public/audio/temp");
  fs.mkdirSync(tempDir, { recursive: true });

  for (const item of DIALOGUES) {
    console.log(`Generating Turn ${item.id}...`);

    // 1. Clerk dialogue (rate -10% ~ 0.9x)
    {
      const clerkFile = path.join(AUDIO_DIR, `turn${item.id}_clerk.mp3`);
      const res = await tts.toFile(tempDir, item.clerk, { rate: "-10%" });
      fs.copyFileSync(res.audioFilePath, clerkFile);
      fs.unlinkSync(res.audioFilePath);
      console.log(`Saved ${clerkFile} (${fs.statSync(clerkFile).size} bytes)`);
    }

    // 2. Target normal Listen (rate -10% ~ 0.9x)
    {
      const normalFile = path.join(AUDIO_DIR, `turn${item.id}_target_normal.mp3`);
      const res = await tts.toFile(tempDir, item.target, { rate: "-10%" });
      fs.copyFileSync(res.audioFilePath, normalFile);
      fs.unlinkSync(res.audioFilePath);
      console.log(`Saved ${normalFile} (${fs.statSync(normalFile).size} bytes)`);
    }

    // 3. Target slow Slow (rate -30% ~ 0.7x)
    {
      const slowFile = path.join(AUDIO_DIR, `turn${item.id}_target_slow.mp3`);
      const res = await tts.toFile(tempDir, item.target, { rate: "-30%" });
      fs.copyFileSync(res.audioFilePath, slowFile);
      fs.unlinkSync(res.audioFilePath);
      console.log(`Saved ${slowFile} (${fs.statSync(slowFile).size} bytes)`);
    }
  }

  fs.rmdirSync(tempDir);
  console.log("All 15 MP3 audio files generated successfully!");
}

generateAll().catch((err) => {
  console.error("Error generating audio:", err);
  process.exit(1);
});
