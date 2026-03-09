// Basic tests for Atoms Ninja Backend
const http = require("http");

async function testHealthCheck() {
  return new Promise((resolve, reject) => {
    http
      .get("http://localhost:3001/health", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            console.log("✓ Health check passed");
            resolve(true);
          } else {
            console.log("✗ Health check failed");
            resolve(false);
          }
        });
      })
      .on("error", reject);
  });
}

async function testMultiAIEndpoint() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: "Hello Atom, are you ready for production?",
    });

    const options = {
      hostname: "localhost",
      port: 3001,
      path: "/api/multi-ai",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.response) {
              console.log(
                "✓ Multi-AI endpoint working (Provider: " +
                  (json.provider || "unknown") +
                  ")",
              );
              resolve(true);
            } else {
              console.log("✗ Multi-AI endpoint failed: No response in JSON");
              resolve(false);
            }
          } catch (e) {
            console.log("✗ Multi-AI endpoint failed: Invalid JSON");
            resolve(false);
          }
        } else {
          console.log("✗ Multi-AI endpoint failed:", res.statusCode);
          resolve(false);
        }
      });
    });

    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log("🧪 Running Atoms Ninja Backend Production Tests...\n");

  // Check environment
  const hasAI =
    !!process.env.VENICE_API_KEY || !!process.env.OPENROUTER_API_KEY;
  if (!hasAI) {
    console.log("⚠️  Warning: No AI provider keys found in environment.");
  }

  try {
    const health = await testHealthCheck();
    const ai = await testMultiAIEndpoint();

    if (health && ai) {
      console.log("\n✅ All core production tests passed!");
      process.exit(0);
    } else {
      console.error("\n❌ Some production tests failed.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Tests crashed:", error.message);
    process.exit(1);
  }
}

// Run tests after a short delay for server startup if used in integrated environments
setTimeout(runTests, 1000);
