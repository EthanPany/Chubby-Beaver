import "dotenv/config";
import WebSocket from "ws";

const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

const ws = new WebSocket(url, {
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "OpenAI-Beta": "realtime=v1",
  },
});

ws.on("open", () => {
  console.log("Connected to server.");

  // session config for audio detection
  ws.send(
    JSON.stringify({
      type: "session.update",
      session: {
        instructions: "You are a helpful assistant. When you hear audio input, respond conversationally.",
        modalities: ["audio", "text"], // enable audio input and output
        voice: "alloy",
        output_audio_format: "pcm16",
        input_audio_format: "pcm16", // input format
        input_audio_transcription: {
          model: "whisper-1" // transcription enabled
        }
      },
    })
  );
});

// Message handler
ws.on("message", (message: WebSocket.RawData) => {
  try {
    const event = JSON.parse(message.toString()) as Record<string, unknown>;
    console.log("Received event:", event.type);

    switch (event.type) {
      case "session.created":
        console.log("Session created, ready for audio!");
        break;

      case "input_audio_buffer.speech_started":
        console.log("User started speaking...");
        break;

      case "input_audio_buffer.speech_stopped":
        console.log("User stopped speaking, processing...");
        // Commit audio and generate response
        ws.send(JSON.stringify({
          type: "input_audio_buffer.commit"
        }));
        ws.send(JSON.stringify({
          type: "response.create"
        }));
        break;

      case "conversation.item.input_audio_transcription.completed":
        const transcription = event.transcript as string;
        console.log("Transcription:", transcription);
        break;

      case "response.audio.delta":
        // Audio response
        const audioData = event.delta as string;
        if (audioData) {
          const audioBuffer = Buffer.from(audioData, 'base64');
          console.log(`Received audio chunk: ${audioBuffer.length} bytes`);  //might need to play audio buffer through speaker (once mic is added)
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
        break;

      case "error":
        console.error("Error:", event.error);
        break;
    }
  } catch (e) {
    console.error("Failed to parse message:", e);
  }
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err);
});

// Function sends audio data (might need this for mic)
export function sendAudioData(audioBuffer: Buffer) {
  if (ws.readyState === WebSocket.OPEN) {
    const base64Audio = audioBuffer.toString('base64');
    ws.send(JSON.stringify({
      type: "input_audio_buffer.append",
      audio: base64Audio
    }));
  } else {
    console.warn("WebSocket not open, cannot send audio");
  }
}

// Function if manual triggering required
export function triggerResponse() {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: "input_audio_buffer.commit"
    }));
    ws.send(JSON.stringify({
      type: "response.create"
    }));
  }
}

// Testing with text
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
      type: "response.create"
    }));
  }
}

//test
setTimeout(() => {
  sendTextMessage("Hello, can you hear me?");
}, 3000);
