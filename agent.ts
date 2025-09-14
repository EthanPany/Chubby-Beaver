import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";  
//openAi TS SDK changed from realtimesessionco
//just openai

//initialize the openai client using 
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

//asynchronous function to boost concurrent request processing performance
async function main() {
  // chat completion request
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Say: my API is working!" }],
  }); // store text response
  const text = response.choices[0].message.content;
  console.log("Assistant:", text);

  // synthesize speech
  //gpt's tts
  const audioResp = await client.audio.speech.create({
    model: "gpt-4o-mini-tts", // TTS model
    voice: "alloy",           //voice type
    input: text!,
  });

  // save to file
  const buffer = Buffer.from(await audioResp.arrayBuffer());
  fs.writeFileSync("assistant.mp3", buffer);
  console.log("Saved assistant.mp3");
}

main().catch(console.error);
