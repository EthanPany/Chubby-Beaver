import { ToolCall, AppServer, AppSession } from '@mentra/sdk';
import path from 'path';
import { setupExpressRoutes } from './webview';
import { handleToolCall } from './tools';
import axios from 'axios';

const PACKAGE_NAME = process.env.PACKAGE_NAME ?? (() => { throw new Error('PACKAGE_NAME is not set in .env file'); })();
const MENTRAOS_API_KEY = process.env.MENTRAOS_API_KEY ?? (() => { throw new Error('MENTRAOS_API_KEY is not set in .env file'); })();
const PORT = parseInt(process.env.PORT || '3000');
const GYRO_SERVER_URL = 'http://localhost:3001';

class MITBuildingGuideApp extends AppServer {
  constructor() {
    super({
      packageName: PACKAGE_NAME,
      apiKey: MENTRAOS_API_KEY,
      port: PORT,
      publicDir: path.join(__dirname, '../public'),
    });

    // Set up Express routes
    setupExpressRoutes(this);
  }

  /** Map to store active user sessions */
  private userSessionsMap = new Map<string, AppSession>();

  /**
   * Handles tool calls from the MentraOS system
   * @param toolCall - The tool call request
   * @returns Promise resolving to the tool call response or undefined
   */
  protected async onToolCall(toolCall: ToolCall): Promise<string | undefined> {
    return handleToolCall(toolCall, toolCall.userId, this.userSessionsMap.get(toolCall.userId));
  }

  /**
   * Handles new user sessions - MIT Building Guide
   * @param session - The app session instance
   * @param sessionId - Unique session identifier
   * @param userId - User identifier
   */
  protected async onSession(session: AppSession, sessionId: string, userId: string): Promise<void> {
    this.userSessionsMap.set(userId, session);

    // Show welcome message
    session.layouts.showTextWall("MIT Building Guide", { durationMs: 2000 });

    // Variables to store current location and heading
    let currentLat: number | undefined;
    let currentLng: number | undefined;

    // Listen for real location updates from MentraOS
    session.events.onLocation(async (data) => {
      console.log(`📍 Real MentraOS location: ${data.lat}, ${data.lng}`);
      currentLat = data.lat;
      currentLng = data.lng;
      await updateBuildingDetection();
    });

    // Function to get facing building from gyro server
    const getFacingBuildingFromGyroServer = async (): Promise<string | null> => {
      try {
        const response = await axios.get(`${GYRO_SERVER_URL}/api/location/facing`);
        console.log(`🔍 Gyro server response:`, response.data);
        const facingBuilding = response.data.facingBuilding;
        return facingBuilding ? facingBuilding.name : null;
      } catch (error) {
        console.error('❌ Error fetching from gyro server:', error.message);
        return null;
      }
    };

    // Function to update building detection with real data
    const updateBuildingDetection = async () => {
      try {
        // Get the currently facing building from the gyro server
        const facingBuildingName = await getFacingBuildingFromGyroServer();

        if (facingBuildingName) {
          // Show the building name on the glass display
          session.layouts.showTextWall(facingBuildingName, {
            durationMs: 2000
          });
          console.log(`🏢 Displaying on glass: ${facingBuildingName}`);
        } else {
          // Show searching message when no building is being faced
          session.layouts.showTextWall("No building in view", {
            durationMs: 2000
          });
        }

      } catch (error) {
        console.error('❌ Building detection error:', error);
        session.layouts.showTextWall("System error", {
          durationMs: 2000
        });
      }
    };

    // Start polling after a delay to allow WebSocket to connect
    let pollInterval: NodeJS.Timeout | null = null;

    setTimeout(() => {
      console.log('🔗 Starting building detection polling');

      // Poll the gyro server for updates every 2 seconds
      pollInterval = setInterval(async () => {
        try {
          await updateBuildingDetection();
        } catch (error) {
          // Ignore WebSocket errors, connection might be reconnecting
          if (!error.message?.includes('WebSocket not connected')) {
            console.error('❌ Polling error:', error);
          }
        }
      }, 2000);
    }, 3000); // Wait 3 seconds for WebSocket to connect

    // Cleanup when session ends
    this.addCleanupHandler(() => {
      this.userSessionsMap.delete(userId);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    });
  }

  // Cleanup method
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down MIT Building Guide app');
  }
}

// Start the server
const app = new MITBuildingGuideApp();

app.start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await app.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await app.shutdown();
  process.exit(0);
});