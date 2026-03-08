require("dotenv").config({ path: "../.env" });
const { initAdminSdk, listDomainUsers } = require("../lib/google-admin");

async function runTest() {
  console.log("🧪 Testing Google Admin SDK Integration...");
  console.log("---------------------------------------------------");
  console.log("⚠️ Note: This test requires valid credentials to be set.");
  console.log(
    "   Ensure GOOGLE_APPLICATION_CREDENTIALS points to a valid JSON file.",
  );
  console.log("---------------------------------------------------\n");

  try {
    console.log("Step 1: Initializing SDK for ashwinazer@gmail.com...");
    await initAdminSdk("ashwinazer@gmail.com");
    console.log("✅ SDK Initialized Successfully.\n");

    console.log("Step 2: Attempting to list users...");
    try {
      const users = await listDomainUsers();
      console.log(`✅ Successfully retrieved ${users.length} users.`);
      users.forEach((u) =>
        console.log(`   - ${u.primaryEmail} (${u.name.fullName})`),
      );
    } catch (listError) {
      console.log(
        "❌ Failed to list users. This is expected if the service account",
      );
      console.log(
        "   lacks Domain-Wide Delegation or the correct customer ID.",
      );
      console.error("   Details:", listError.message);
    }
  } catch (error) {
    console.error("❌ Critical Error during test:", error.message);
    console.log("\nTroubleshooting:");
    console.log(
      "1. Check if GOOGLE_APPLICATION_CREDENTIALS is set and points to the right file.",
    );
    console.log(
      "2. Verify the Service Account has 'https://www.googleapis.com/auth/admin.directory.user.readonly' scopes.",
    );
    console.log(
      "3. Ensure Domain-Wide Delegation is active for 'ashwinazer@gmail.com'.",
    );
  }
}

runTest();
