const { google } = require("googleapis");

// Note: This relies on GOOGLE_APPLICATION_CREDENTIALS being set in the environment.
// For Domain-Wide Delegation, the service account needs to be configured in the Google Workspace Admin console
// to act on behalf of the specified user.

let adminDirectory = null;

/**
 * Initializes the Google Admin SDK Directory service.
 * Automatically tries to use Application Default Credentials.
 *
 * @param {string} subjectEmail - The email address of the user to impersonate (e.g., ashwinazer@gmail.com).
 *                                For Workspace, this must be a user within the domain. Note that standard
 *                                @gmail.com accounts do not have an Admin console, but this demonstrates the setup
 *                                if it were a Google Workspace domain account.
 */
async function initAdminSdk(subjectEmail = "ashwinazer@gmail.com") {
  if (adminDirectory) return adminDirectory;

  try {
    // We use google.auth.getClient to automatically get credentials from the environment
    // (e.g., GOOGLE_APPLICATION_CREDENTIALS)
    const auth = await google.auth.getClient({
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user.readonly",
        // Add more scopes as needed for specific admin tasks
      ],
      // If the service account has domain-wide delegation, uncomment the next line
      // and ensure the subjectEmail is a valid admin/user in the Workspace domain.
      // clientOptions: { subject: subjectEmail }
    });

    adminDirectory = google.admin({ version: "directory_v1", auth });
    console.log(
      `[Google Admin] Initialized Google Admin SDK (Subject: ${subjectEmail})`,
    );
    return adminDirectory;
  } catch (error) {
    console.error(
      "[Google Admin] Failed to initialize Google Admin SDK:",
      error,
    );
    throw error;
  }
}

/**
 * Example function to list users in the domain.
 * This is a backend-only function.
 */
async function listDomainUsers() {
  try {
    const adminApi = await initAdminSdk();
    const res = await adminApi.users.list({
      // You might need to specify a domain ('example.com') or customer ('my_customer')
      customer: "my_customer",
      maxResults: 10,
      orderBy: "email",
    });
    return res.data.users || [];
  } catch (error) {
    console.error("[Google Admin] Error listing users:", error);
    throw error;
  }
}

module.exports = {
  initAdminSdk,
  listDomainUsers,
};
