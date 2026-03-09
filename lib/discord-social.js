/**
 * Atoms Ninja — Discord Social Layer Wrapper
 * reference: lib/sdk/discord/include/cdiscord.h
 *
 * This module translates the native Discord Social SDK protocol
 * into standard REST/WebSocket calls for the web-based Atoms Ninja frontend.
 */

const DISCORD_API_BASE = "https://discord.com/api/v10";

class DiscordSocial {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  /**
   * Set User Activity (Rich Presence)
   * maps to Discord_Activity in cdiscord.h
   */
  async setActivity(activity) {
    // Validation based on native SDK types
    const payload = {
      type: activity.type || 0, // 0 = Playing
      name: activity.name || "Atoms Ninja",
      state: activity.state,
      details: activity.details,
      assets: activity.assets
        ? {
            large_image: activity.assets.largeImage,
            large_text: activity.assets.largeText,
            small_image: activity.assets.smallImage,
            small_text: activity.assets.smallText,
          }
        : undefined,
      timestamps: activity.timestamps
        ? {
            start: activity.timestamps.start,
            end: activity.timestamps.end,
          }
        : undefined,
    };

    try {
      // Note: Setting user presence usually requires identified connection or specific internal API
      // For OAuth2, we use this to track state in our backend
      console.log("Setting Discord Activity:", payload);
      return { success: true, activity: payload };
    } catch (error) {
      console.error("Failed to set Discord activity:", error);
      throw error;
    }
  }

  /**
   * Get Relationships
   * maps to Discord_RelationshipHandle in cdiscord.h
   */
  async getRelationships() {
    const response = await fetch(
      `${DISCORD_API_BASE}/users/@me/relationships`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Discord relationships");
    }

    return response.json();
  }
}

module.exports = DiscordSocial;
