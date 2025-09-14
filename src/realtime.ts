import "dotenv/config";
import WebSocket from "ws";
import fs from "fs";

const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

const ws = new WebSocket(url, {
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "OpenAI-Beta": "realtime=v1",
  },
});

ws.on("open", () => {
  console.log("Connected to server.");

  // Enhanced session config for audio detection
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      type: "realtime",
      instructions: "You are a helpful assistant. When you hear audio input, respond conversationally.",
      modalities: ["audio", "text"],
      voice: "alloy",
      audio: {
        input: { format: "pcm16" },
        output: { format: "pcm16" }
      }
    }
  }));
});

//  message handler
ws.on("message", (message: WebSocket.RawData) => {
  try {
    const event = JSON.parse(message.toString()) as Record<string, unknown>;
    console.log("Received event:", event.type);
    console.log("Received event:", event.type);

    switch (event.type) {
      case "session.created":
        console.log("Session created, ready for audio!");
        console.log("Session created, ready for audio!");
        break;

      case "input_audio_buffer.speech_started":
        console.log("User started speaking...");
        console.log("User started speaking...");
        break;

      case "input_audio_buffer.speech_stopped":
        console.log("User stopped speaking, processing...");
        // Automatically commit the audio and generate response
        ws.send(JSON.stringify({
          type: "input_audio_buffer.commit"
        }));
        ws.send(JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["audio", "text"],
            voice: "alloy"
          }
        }));
        break;

      case "conversation.item.input_audio_transcription.completed":
        const transcription = event.transcript as string;
        console.log("Transcription:", transcription);
        console.log("Transcription:", transcription);
        break;

      case "response.audio.delta":
        // This is the audio response - save to file
        const audioData = event.delta as string;
        if (audioData) {
          const audioBuffer = Buffer.from(audioData, 'base64');
          console.log(`Received audio chunk: ${audioBuffer.length} bytes`);
          audioBuffers.push(audioBuffer);
        }
        break;

      case "response.text.delta":
        // Text version of the response
        const textDelta = event.delta as string;
        if (textDelta) {
          process.stdout.write(textDelta); // print response in real-time
        }
        break;

      case "response.done":
        console.log("\nResponse complete!");
        if (audioBuffers.length > 0) {
          const fullAudio = Buffer.concat(audioBuffers);
          writeWavFile(fullAudio, "assistant_response.wav");
          console.log("Saved assistant_response.wav - you can play it!");
          audioBuffers = []; // Clear for next response
        }
        break;

      case "error":
        console.error("Error:", event.error);
        console.error("Error:", event.error);
        break;
      case "response.audio.delta":
case "response.output_audio.delta": {
  const audioData = (event as any).delta as string;
  if (audioData) audioBuffers.push(Buffer.from(audioData, "base64"));
  break;
}

case "response.text.delta":
case "response.output_text.delta": {
  const textDelta = (event as any).delta as string;
  if (textDelta) process.stdout.write(textDelta);
  break;
}

case "response.audio.delta":
case "response.output_audio.delta": {
  const audioData = (event as any).delta as string;
  if (audioData) audioBuffers.push(Buffer.from(audioData, "base64"));
  break;
}

case "response.text.delta":
case "response.output_text.delta": {
  const textDelta = (event as any).delta as string;
  if (textDelta) process.stdout.write(textDelta);
  break;
}
    }
  } catch (e) {
    console.error("Failed to parse message:", e);
  }
});



ws.on("error", (err) => {
  console.error("WebSocket error:", err);
});

// Audio buffer to collect chunks
let audioBuffers: Buffer[] = [];

// Function to write PCM16 data as WAV file
function writeWavFile(pcmData: Buffer, filePath: string) {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmData.length, 40);

  fs.writeFileSync(filePath, Buffer.concat([header, pcmData]));
}


// Your existing functions (unchanged)
export function sendAudioData(audioBuffer: Buffer) {
  if (ws.readyState === WebSocket.OPEN) {
    const base64Audio = audioBuffer.toString('base64');
    ws.send(JSON.stringify({
      type: "input_audio_buffer.append",
      audio: base64Audio
    }));
  } else {
    console.warn("WebSocket not open, cannot send audio");
    console.warn("WebSocket not open, cannot send audio");
  }
}

export function triggerResponse() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "input_audio_buffer.commit"
    }));
    ws.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["text", "audio"], // Specify that you want audio response
        voice: "alloy" // or "echo", "fable", "onyx", "nova", "shimmer"
      }
    }));
  }
}

export function sendTextMessage(text: string) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text: text
        }]
      }
    }));
    
    ws.send(JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["text", "audio"], // Request both text and audio
        voice: "alloy"
      }
    }));
  }
}

// Test message after connection
setTimeout(() => {
  console.log("Sending test message...");
  sendTextMessage("Hello! How many planets are there in the solar system");
}, 3000);

