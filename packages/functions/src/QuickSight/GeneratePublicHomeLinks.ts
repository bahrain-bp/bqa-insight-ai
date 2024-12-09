import { QuickSightClient, GenerateEmbedUrlForAnonymousUserCommand } from "@aws-sdk/client-quicksight";

export interface SheetEmbedConfig {
  dashboardId: string;
  sheetId: string; // For documentation; not used in API directly.
}

export class QuickSightService {
  private quickSightClient: QuickSightClient;

  constructor(region: string) {
    this.quickSightClient = new QuickSightClient({ region });
  }

  /**
   * Generates an embed URL for a given QuickSight dashboard.
   * @param accountId AWS Account ID
   * @param dashboardId Dashboard ID
   * @param allowedDomains Array of allowed domains for embedding
   * @returns Embed URL string
   */
  async generateEmbedUrl(
    accountId: string,
    dashboardId: string,
    allowedDomains: string[]
  ): Promise<string> {
    try {
      const command = new GenerateEmbedUrlForAnonymousUserCommand({
        AwsAccountId: accountId,
        SessionLifetimeInMinutes: 60, // 1-hour session
        Namespace: "default", // Default namespace; adjust as needed
        AuthorizedResourceArns: [
          `arn:aws:quicksight:us-east-1:${accountId}:dashboard/${dashboardId}`,
        ],
        ExperienceConfiguration: {
          Dashboard: {
            InitialDashboardId: dashboardId,
          },
        },
        AllowedDomains: allowedDomains,
      });

      const response = await this.quickSightClient.send(command);
      return response.EmbedUrl || "";
    } catch (error) {
      console.error(`Error generating embed URL for dashboard ${dashboardId}:`, error);
      throw new Error("Failed to generate embed URL");
    }
  }
}
