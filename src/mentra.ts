import { AppServer, AppSession } from "@mentra/sdk";

class AudioDemoServer extends AppServer {
  protected async onSession(
    session: AppSession,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    session.logger.info(`Audio demo session started for ${userId}`);

    // Example: Play a notification sound
    try {
      const result = await session.audio.playAudio({
        audioUrl: "https://okgodoit.com/cool.mp3"
      });

      if (result.success) {
        session.logger.info(`Audio played successfully`);
        if (result.duration) {
          session.logger.info(`Duration: ${result.duration} ms`);
        }
      } else {
        session.logger.error(`❌ Audio playback failed: ${result.error}`);
      }
    } catch (error) {
      session.logger.error(`Exception during audio playback: ${error}`);
    }
  }
}

// Bootstrap the server
new AudioDemoServer({
  packageName: process.env.PACKAGE_NAME ?? "com.example.audio",
  apiKey: process.env.MENTRAOS_API_KEY!,
  port: Number(process.env.PORT ?? "3000"),
}).start();