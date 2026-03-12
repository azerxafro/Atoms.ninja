(() => {
  console.log("%c🥷 Atoms Ninja: System Initializing...", "color: #10B981; font-weight: bold; font-size: 14px;");

  // Launch console button safety check
  const launchBtn = document.getElementById("launchBtn");
  if (launchBtn) {
    launchBtn.addEventListener("click", () => {
      const cmdInput = document.getElementById("commandInput");
      if (cmdInput) cmdInput.focus();
      const demoCard = document.querySelector(".demo-card");
      if (demoCard) demoCard.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // Documentation button safety check
  const docsBtn = document.getElementById("docsBtn");
  if (docsBtn) {
    docsBtn.addEventListener("click", () => {
      if (typeof window.addTerminalLine === "function") {
        window.addTerminalLine(
          "Documentation: Visit https://atoms.ninja/docs for reference",
          "info",
        );
      }
    });
  }

  // Command input safety check
  const commandInput = document.getElementById("commandInput");
  if (commandInput) {
    commandInput.addEventListener("focus", () => {
      commandInput.style.transform = "scale(1.01)";
    });

    commandInput.addEventListener("blur", () => {
      commandInput.style.transform = "scale(1)";
    });
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.window.pageYOffset;
        const parallaxElements = document.querySelectorAll(".demo-card");
        parallaxElements.forEach((el) => {
          const speed = 0.5;
          const yPos = -(scrolled * speed);
          el.style.transform = `translateY(${yPos}px)`;
        });
        ticking = false;
      });
      ticking = true;
    }
  });

  // Add floating animation to feature cards
const featureCards = document.querySelectorAll(".feature-card");

featureCards.forEach((card, index) => {
  card.style.animationDelay = `${index * 0.1}s`;

  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-12px) rotate(1deg)";
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "translateY(0) rotate(0deg)";
  });
});

// Button ripple effect
const buttons = document.querySelectorAll("button");

buttons.forEach((button) => {
  button.addEventListener("click", function (e) {
    const ripple = document.createElement("span");
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = x + "px";
    ripple.style.top = y + "px";
    ripple.classList.add("ripple");

    this.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  });
});

// Add ripple effect styles dynamically
const style = document.createElement("style");
style.textContent = `
    button {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, observerOptions);

// Observe all feature cards and stats
const animatedElements = document.querySelectorAll(".feature-card, .stat-item");
animatedElements.forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(30px)";
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(el);
});

// Add cursor glow effect
const cursorGlow = document.createElement("div");
cursorGlow.style.cssText = `
    position: fixed;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
    transition: opacity 0.3s ease;
    opacity: 0;
`;
document.body.appendChild(cursorGlow);

document.addEventListener("mousemove", (e) => {
  cursorGlow.style.left = e.clientX + "px";
  cursorGlow.style.top = e.clientY + "px";
  cursorGlow.style.opacity = "1";
});

document.addEventListener("mouseleave", () => {
  cursorGlow.style.opacity = "0";
});

// Console Easter egg
console.log(
  "%c🥷 Atoms Ninja - Cybersecurity Platform",
  "font-size: 24px; font-weight: bold; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;",
);
console.log(
  "%c⚠️  For authorized security testing only!",
  "font-size: 14px; color: #EF4444; font-weight: bold;",
);
console.log(
  "%cPowered by Atom AI & Ninja Engine",
  "font-size: 12px; color: #00ff00;",
);

// API is handled server-side via OpenRouter — no client-side key needed

// Clear chat history helper
window.clearChatHistory = function () {
  chatHistory = [];
  localStorage.removeItem("atomsNinjaChatHistory");
  console.log(
    "%c✓ Chat history cleared!",
    "color: #10B981; font-weight: bold;",
  );
  addTerminalLine("Chat memory cleared. Starting fresh conversation.", "info");
};

// View chat history helper
window.viewChatHistory = function () {
  console.log(
    "%c📝 Chat History:",
    "font-size: 16px; font-weight: bold; color: #8B5CF6;",
  );
  chatHistory.forEach((interaction, index) => {
    console.log(
      `%c--- Interaction ${index + 1} ---`,
      "color: #EC4899; font-weight: bold;",
    );
    console.log(`User: ${interaction.user}`);
    console.log(`AI: ${interaction.ai.substring(0, 100)}...`);
    if (interaction.command) console.log(`Executed: ${interaction.command}`);
  });
};

// Advanced session management
window.viewSession = function () {
  console.log(
    "%c📊 Current Session Intelligence:",
    "font-size: 18px; font-weight: bold; color: #8B5CF6;",
  );
  console.log("%c" + getSessionSummary(), "color: #10B981;");

  if (currentSession.findings.length > 0) {
    console.log(
      "%c🔍 Findings:",
      "font-size: 14px; font-weight: bold; color: #EC4899;",
    );
    currentSession.findings.forEach((finding, i) => {
      console.log(
        `${i + 1}. [${finding.tool}] ${finding.target} - ${finding.result.substring(0, 100)}...`,
      );
    });
  }

  if (currentSession.vulnerabilities.length > 0) {
    console.log(
      "%c⚠️  Vulnerabilities:",
      "font-size: 14px; font-weight: bold; color: #EF4444;",
    );
    currentSession.vulnerabilities.forEach((vuln, i) => {
      console.log(`${i + 1}. [${vuln.severity.toUpperCase()}] ${vuln.type}`);
    });
  }
};

window.startNewSession = function () {
  startNewSession();
  console.log("%c✓ New session started!", "color: #10B981; font-weight: bold;");
  addTerminalLine("New penetration testing session initialized.", "success");
};

window.exportSession = function () {
  const exportData = {
    session: currentSession,
    chatHistory: chatHistory,
    exportDate: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(
    exportData,
    (key, value) => {
      if (value instanceof Set) return Array.from(value);
      return value;
    },
    2,
  );

  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `atoms-ninja-session-${Date.now()}.json`;
  a.click();

  console.log("%c✓ Session exported!", "color: #10B981; font-weight: bold;");
};

// Generate penetration testing report
window.generateReport = function () {
  const report = `
═══════════════════════════════════════════════════════════════
ATOMS NINJA - PENETRATION TESTING REPORT
═══════════════════════════════════════════════════════════════

Session ID: ${currentSession.id}
Start Time: ${currentSession.startTime}
Duration: ${Math.round((Date.now() - currentSession.id) / 1000 / 60)} minutes

SCOPE
─────
Targets Scanned: ${currentSession.targets.size}
${Array.from(currentSession.targets)
  .map((t) => `  • ${t}`)
  .join("\n")}

METHODOLOGY
───────────
Tools Used: ${Array.from(currentSession.toolsUsed).join(", ")}
Total Operations: ${currentSession.findings.length}

FINDINGS
────────
${currentSession.findings
  .map(
    (f, i) => `
${i + 1}. [${f.tool.toUpperCase()}] ${f.target}
   Timestamp: ${f.timestamp}
   Result: ${f.result.substring(0, 200)}...
`,
  )
  .join("\n")}

VULNERABILITIES DETECTED
────────────────────────
${
  currentSession.vulnerabilities.length === 0
    ? "None detected in automated scans."
    : currentSession.vulnerabilities
        .map(
          (v, i) => `
${i + 1}. [${v.severity.toUpperCase()}] ${v.type}
   Detected: ${v.timestamp}
   Details: ${v.details}
`,
        )
        .join("\n")
}

RECOMMENDATIONS
───────────────
${
  currentSession.recommendations.length === 0
    ? "• Conduct manual verification of automated findings\n• Review security configurations\n• Implement security best practices"
    : currentSession.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")
}

═══════════════════════════════════════════════════════════════
Generated: ${new Date().toISOString()}
Tool: Atoms Ninja Cybersecurity Platform
═══════════════════════════════════════════════════════════════
`;

  console.log(report);

  // Download as file
  const blob = new Blob([report], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pentest-report-${Date.now()}.txt`;
  a.click();

  addTerminalLine(
    "✓ Penetration testing report generated and downloaded!",
    "success",
  );
};

// Display instructions on load
window.addEventListener("load", () => {
  // Load chat history and session from localStorage
  loadChatHistory();
  loadCurrentSession();

  // Setup execute handlers (ensure DOM is ready)
  setupExecuteHandlers();

  console.log(
    `%c📝 Loaded ${chatHistory.length} previous interactions from memory`,
    "color: #10B981;",
  );
  console.log(
    `%c📊 Session: ${currentSession.targets.size} targets, ${currentSession.findings.length} findings`,
    "color: #10B981;",
  );
  console.log(
    "%c🚀 Advanced Features Available:",
    "font-size: 14px; font-weight: bold; color: #8B5CF6;",
  );
  console.log(
    "%c  • viewSession() - View current session intelligence",
    "color: #8B5CF6;",
  );
  console.log(
    "%c  • viewChatHistory() - View conversation history",
    "color: #8B5CF6;",
  );
  console.log(
    "%c  • generateReport() - Generate penetration testing report",
    "color: #8B5CF6;",
  );
  console.log("%c  • exportSession() - Export session data", "color: #8B5CF6;");
  console.log(
    "%c  • startNewSession() - Start new testing session",
    "color: #8B5CF6;",
  );
  console.log("%c  • clearChatHistory() - Clear memory", "color: #8B5CF6;");

  console.log(
    "%cAI features powered by OpenRouter (server-side)",
    "color: #8B5CF6; font-style: italic;",
  );
});

// Settings Modal
const settingsModal = document.getElementById("settingsModal");
const settingsBtn = document.getElementById("settingsBtn");
const closeModal = document.getElementById("closeModal");
const saveAiKey = document.getElementById("saveAiKey");
const testMCPConnection = document.getElementById("testMCPConnection");
const aiApiKeyInput = document.getElementById("aiApiKey");
const mcpEndpointInput = document.getElementById("mcpEndpoint");
const devModeToggle = document.getElementById("devModeToggle");

let devModeEnabled = false;

// Dev Mode Toggle Handler
if (devModeToggle) {
  devModeToggle.addEventListener("change", (e) => {
    devModeEnabled = e.target.checked;
    const statusDiv = document.getElementById("apiKeyStatus");

    if (devModeEnabled) {
      statusDiv.className = "status-message info";
      statusDiv.textContent = "⚠️ Dev Mode enabled";
      statusDiv.style.display = "block";
      addTerminalLine("Dev Mode enabled", "info");
    } else {
      statusDiv.className = "status-message success";
      statusDiv.textContent = "🔒 Dev Mode disabled";
      statusDiv.style.display = "block";
      addTerminalLine("Dev Mode disabled", "success");
    }

    localStorage.setItem("dev_mode_enabled", devModeEnabled);
    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 5000);
  });
}

// Open settings modal
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("active");

  // Load saved dev mode state
  const savedDevMode = localStorage.getItem("dev_mode_enabled") === "true";
  devModeToggle.checked = savedDevMode;
  devModeEnabled = savedDevMode;
});

// Close modal
closeModal.addEventListener("click", () => {
  settingsModal.classList.remove("active");
});

// Close on outside click
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove("active");
  }
});

// API key handling removed — AI runs through OpenRouter on the server

// Test MCP Connection
testMCPConnection.addEventListener("click", async () => {
  const endpoint = mcpEndpointInput.value.trim();
  const statusDiv = document.getElementById("mcpStatus");

  statusDiv.className = "status-message info";
  statusDiv.textContent = "🔄 Testing connection...";

  try {
    // Real connection test to the backend health endpoint
    const response = await fetch(`${CONFIG.BACKEND_API_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error("Backend unreachable");
    const health = await response.json();

    if (health.ec2 && health.ec2.status === "unreachable") {
      throw new Error("Kali MCP (EC2) is unreachable");
    }

    CONFIG.KALI_MCP_ENDPOINT = endpoint;
    if (typeof AtomsNinjaConfig !== "undefined") {
      AtomsNinjaConfig.kaliMCP.endpoint = endpoint;
    }

    localStorage.setItem("mcp_endpoint", endpoint);

    statusDiv.className = "status-message success";
    statusDiv.textContent = "✅ Connected to Kali Linux MCP Server";

    addTerminalLine(`MCP Server connected at ${endpoint}`, "success");
  } catch (error) {
    statusDiv.className = "status-message error";
    statusDiv.textContent =
      "❌ Connection failed. Please check the endpoint and try again.";
  }

  setTimeout(() => {
    statusDiv.style.display = "none";
  }, 5000);
});

// Load saved configuration on startup
window.addEventListener("load", () => {
  const savedEndpoint = localStorage.getItem("mcp_endpoint");

  addTerminalLine("AI powered by OpenRouter (server-side).", "info");

  if (savedEndpoint) {
    CONFIG.KALI_MCP_ENDPOINT = savedEndpoint;
    if (typeof AtomsNinjaConfig !== "undefined") {
      AtomsNinjaConfig.kaliMCP.endpoint = savedEndpoint;
    }
    mcpEndpointInput.value = savedEndpoint;
  }
});

// Quick command clicks
document.querySelectorAll(".quick-commands code").forEach((codeEl) => {
  codeEl.addEventListener("click", () => {
    commandInput.value = codeEl.textContent;
    commandInput.focus();
    settingsModal.classList.remove("active");
    document
      .querySelector(".demo-card")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

// End of DOMContentLoaded

// CVE Analysis and Visualization
async function analyzeCVEs(scanOutput, originalCommand) {
  try {
    addTerminalLine("🔍 Analyzing for known vulnerabilities...", "info");

    const response = await fetch(`${CONFIG.BACKEND_API_URL}/cve-lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanOutput }),
    });

    if (!response.ok) throw new Error("CVE lookup failed");

    const data = await response.json();

    if (data.vulnerabilities && data.vulnerabilities.length > 0) {
      // Add vulnerabilities to session
      if (typeof atomSession !== "undefined") {
        atomSession.currentSession.vulnerabilities.push(...data.vulnerabilities);
        atomSession.saveCurrentSession();
      }

      // Display formatted results
      addTerminalLine(`\n${"═".repeat(60)}`, "info");
      addTerminalLine("🎯 VULNERABILITY ANALYSIS", "success");
      addTerminalLine(`${"═".repeat(60)}`, "info");

      addTerminalLine(`\n${data.summary}`, "warning");

      addTerminalLine(`\n${"─".repeat(60)}`, "info");
      addTerminalLine("📋 DETECTED SOFTWARE:", "info");
      for (const sw of data.detectedSoftware) {
        addTerminalLine(`  • ${sw.software} ${sw.version}`, "info");
      }

      addTerminalLine(`\n${"─".repeat(60)}`, "info");
      addTerminalLine("🔴 VULNERABILITIES FOUND:", "error");
      for (const vuln of data.vulnerabilities.slice(0, 5)) {
        const severity =
          vuln.severity === "CRITICAL"
            ? "🔴"
            : vuln.severity === "HIGH"
              ? "🟠"
              : "🟡";
        addTerminalLine(
          `\n  ${severity} ${vuln.cve} [${vuln.severity}]`,
          "error",
        );
        addTerminalLine(`     ${vuln.description}`, "info");
        if (vuln.exploitable) {
          addTerminalLine(`     ⚡ EXPLOIT AVAILABLE`, "warning");
        }
      }

      if (data.vulnerabilities.length > 5) {
        addTerminalLine(
          `\n  ... and ${data.vulnerabilities.length - 5} more vulnerabilities`,
          "info",
        );
      }

      addTerminalLine(`\n${"═".repeat(60)}\n`, "info");

      // Suggest attack chains
      setTimeout(
        () => suggestAttackChain(scanOutput, data.vulnerabilities),
        1500,
      );
    } else {
      addTerminalLine(
        "✅ No known critical vulnerabilities detected.",
        "success",
      );
    }
  } catch (error) {
    console.error("CVE analysis error:", error);
  }
}

// Smart Attack Chain Suggestions
async function suggestAttackChain(scanOutput, vulnerabilities) {
  try {
    addTerminalLine("🎯 Generating attack chain suggestions...", "info");

    const target = extractTarget(scanOutput);

    const response = await fetch(`${CONFIG.BACKEND_API_URL}/attack-chain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scanOutput, vulnerabilities, target }),
    });

    if (!response.ok) throw new Error("Attack chain generation failed");

    const data = await response.json();

    if (data.chains && data.chains.length > 0) {
      addTerminalLine(`\n${"═".repeat(60)}`, "info");
      addTerminalLine("⚔️  SUGGESTED ATTACK CHAINS", "success");
      addTerminalLine(`${"═".repeat(60)}`, "info");

      for (const chain of data.chains) {
        addTerminalLine(`\n📌 ${chain.target}:`, "warning");
        for (const step of chain.steps.slice(0, 3)) {
          const risk =
            step.risk === "CRITICAL"
              ? "🔴"
              : step.risk === "HIGH"
                ? "🟠"
                : "🟡";
          addTerminalLine(
            `\n  ${risk} Step ${step.step}: ${step.action}`,
            "info",
          );
          addTerminalLine(`     $ ${step.command}`, "success");
        }
      }

      if (data.aiSuggestions) {
        addTerminalLine(`\n${"─".repeat(60)}`, "info");
        addTerminalLine("🤖 AI ANALYSIS:", "info");
        addTerminalLine(data.aiSuggestions, "info");
      }

      addTerminalLine(`\n${"═".repeat(60)}\n`, "info");
      addTerminalLine(
        "💡 Type any command above to execute it, Chief.",
        "success",
      );
    }
  } catch (error) {
    console.error("Attack chain error:", error);
  }
}

function extractTarget(scanOutput) {
  const ipMatch = scanOutput.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
  const domainMatch = scanOutput.match(/([a-z0-9-]+\.)+[a-z]{2,}/i);
  return ipMatch ? ipMatch[0] : domainMatch ? domainMatch[0] : "TARGET";
}

// Export report command
window.exportReport = function () {
  atomSession.exportReport();
};

// ═══════════════════════════════════════════════
// Arsenal Tab Switching & Tool Logic
// ═══════════════════════════════════════════════

function initArsenal() {
  const isAuth = localStorage.getItem("discord_user") !== null;
  const originalTerminal = document.getElementById("originalDemoCard");
  const arsenalLayout = document.getElementById("arsenalLayout");
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  function toggleMobileMenu() {
    sidebar.classList.toggle("active");
    sidebarOverlay.classList.toggle("active");
    if (menuToggle) menuToggle.classList.toggle("active");
  }

  function closeMobileMenu() {
    sidebar.classList.remove("active");
    sidebarOverlay.classList.remove("active");
    if (menuToggle) menuToggle.classList.remove("active");
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMobileMenu);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeMobileMenu);
  }



  // Show Arsenal immediately, auth is optional
  if (arsenalLayout) arsenalLayout.style.display = "flex";
  const loginGate = document.getElementById("loginGate");
  const mainApp = document.getElementById("mainApp");
  if (loginGate) { loginGate.style.display = "none"; loginGate.classList.add("hidden-on-load"); }
  if (mainApp) { mainApp.style.display = "flex"; mainApp.classList.remove("hidden-on-load"); }
  // Handle sidebar clicks
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  const arsenalTabs = document.querySelectorAll(".arsenal-tab");

  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      const tabId = item.getAttribute("data-tab");
      console.log(`[Atoms] Sidebar click: ${tabId}`);
      if (!tabId) return;

      const allTabs = document.querySelectorAll(".arsenal-tab");

      // Hide all tabs and remove active state
      sidebarItems.forEach((i) => i.classList.remove("active"));
      allTabs.forEach((t) => {
        t.classList.add("hidden-on-load");
        t.classList.remove("active");
        t.style.display = "none"; // Explicitly hide
      });

      // Show the selected tab
      item.classList.add("active");
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        console.log(`[Atoms] Switching to tab: ${tabId}`);
        targetTab.classList.remove("hidden-on-load");
        targetTab.classList.add("active");
        targetTab.style.display = "flex";

        // Tab specific setups
        if (tabId === "tab-reports") {
          if (typeof updateReportDashboard === "function") {
            updateReportDashboard();
          }
        }

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
          closeMobileMenu();
        }
      }
    });
  });

  // Removed featureCards listener linking to arsenal tabs to make sidebar exclusively control section visibility.
  const archSendBtn = document.getElementById("architectSendBtn");
  const archInput = document.getElementById("architectInput");
  const archChat = document.getElementById("architectChatOutput");

  if (archSendBtn && archInput) {
    archSendBtn.addEventListener("click", async () => {
      const msg = archInput.value.trim();
      if (!msg) return;
      archInput.value = "";

      archChat.innerHTML += `<div class="chat-message user"><strong>You:</strong> ${msg}</div>`;
      archChat.scrollTop = archChat.scrollHeight;

      try {
        archChat.innerHTML += `<div class="chat-message bot" id="typingIndicator"><strong>Atom:</strong> <em>Connecting to AI Security Architect on AWS...</em></div>`;
        archChat.scrollTop = archChat.scrollHeight;

        // Real AWS backend — /api/multi-ai goes through OpenRouter on EC2
        const response = await fetch(`${CONFIG.BACKEND_API_URL}/multi-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            chatHistory: [],
            sessionData: {
              targets:
                typeof atomSession !== "undefined"
                  ? Array.from(atomSession.currentSession.targets)
                  : [],
              findings:
                typeof atomSession !== "undefined"
                  ? atomSession.currentSession.findings.length
                  : 0,
            },
            mode: "fast",
          }),
        });

        document.getElementById("typingIndicator")?.remove();

        if (response.ok) {
          const data = await response.json();
          const reply = data.response || data.reply || "No response from AI.";
          const providerInfo = data.provider
            ? ` <em style="color:#666; font-size:11px;">[${data.provider}/${data.model}]</em>`
            : "";
          archChat.innerHTML += `<div class="chat-message bot"><strong>Atom:</strong> ${reply}${providerInfo}</div>`;

          // Show thinking chain if available
          if (data.thinking && data.thinking.length > 0) {
            let thinkingHtml =
              '<details style="margin-top:8px;"><summary style="cursor:pointer; color:#8b5cf6; font-size:12px;">🧠 Thought Process</summary>';
            data.thinking.forEach((step) => {
              thinkingHtml += `<div style="padding:4px 8px; font-size:12px; color:#888;">${step.title}: ${step.content}</div>`;
            });
            thinkingHtml += "</details>";
            archChat.innerHTML += thinkingHtml;
          }

          // If AI auto-executed a tool, show results
          if (data.toolOutput) {
            archChat.innerHTML += `<div class="chat-message bot" style="color:#10B981;"><strong>⚡ Tool Output:</strong><pre style="white-space:pre-wrap; font-size:12px;">${(data.toolOutput.result || "").substring(0, 1500)}</pre></div>`;
          }
        } else {
          const errText = await response.text();
          archChat.innerHTML += `<div class="chat-message bot" style="color:#ef4444;"><strong>Error:</strong> AWS backend returned ${response.status}: ${errText}</div>`;
        }
      } catch (e) {
        document.getElementById("typingIndicator")?.remove();
        archChat.innerHTML += `<div class="chat-message bot" style="color:#ef4444;"><strong>Error:</strong> Network error connecting to AWS: ${e.message}</div>`;
      }
      archChat.scrollTop = archChat.scrollHeight;
    });

    archInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        archSendBtn.click();
      }
    });
  }

  // 3. Digital Forensics — Real tool execution on AWS
  const forensicsVerifyBtn = document.getElementById("forensicsVerifyBtn");
  const forensicsOutput = document.getElementById("forensicsOutput");

  if (forensicsVerifyBtn) {
    forensicsVerifyBtn.addEventListener("click", async () => {
      forensicsOutput.classList.remove("hidden-on-load");
      forensicsOutput.style.display = "block";
      forensicsOutput.innerHTML = `<div class="terminal-line"><span class="terminal-prompt">atom@ninja:~#</span><span class="terminal-text">Running forensic analysis tools on AWS EC2...</span></div>`;

      try {
        // Execute real volatility on AWS
        forensicsOutput.innerHTML += `<div class="terminal-line"><span class="terminal-info">⚡ Connecting to Kali EC2 instance...</span></div>`;

        const response = await fetch(`${CONFIG.BACKEND_API_URL}/kali`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool: "volatility",
            args: ["--help"],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const output =
            data.result ||
            data.stderr ||
            "volatility is available on this host.";
          forensicsOutput.innerHTML += `<div class="terminal-line"><span class="terminal-success">✅ Volatility available on EC2:</span></div>`;
          forensicsOutput.innerHTML += `<pre style="white-space:pre-wrap; font-family:monospace; font-size:12px; color:#10B981; max-height:300px; overflow-y:auto;">${output.substring(0, 2000)}</pre>`;
        } else {
          const errText = await response.text();
          forensicsOutput.innerHTML += `<div class="terminal-line"><span class="terminal-error">❌ Volatility not available: ${errText}</span></div>`;
          // Fallback: try foremost
          forensicsOutput.innerHTML += `<div class="terminal-line"><span class="terminal-info">Trying foremost instead...</span></div>`;
          const fallback = await fetch(`${CONFIG.BACKEND_API_URL}/kali`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tool: "foremost", args: ["-h"] }),
          });
          if (fallback.ok) {
            const fbData = await fallback.json();
            forensicsOutput.innerHTML += `<pre style="white-space:pre-wrap; font-family:monospace; font-size:12px; color:#10B981;">${(fbData.result || fbData.stderr || "").substring(0, 1500)}</pre>`;
          }
        }

        // Also check what other forensics tools are available
        forensicsOutput.innerHTML += `<br><div class="terminal-line"><span class="terminal-info">📋 Checking available forensics tools...</span></div>`;
        const toolCheck = await fetch(`${CONFIG.BACKEND_API_URL}/tools`);
        if (toolCheck.ok) {
          const toolData = await toolCheck.json();
          const forensicsTools = toolData.categories?.forensics || [];
          forensicsOutput.innerHTML += `<div class="terminal-line"><span class="terminal-success">Available forensics tools: ${forensicsTools.join(", ") || "volatility, foremost, scalpel, autopsy, bulk_extractor, photorec, testdisk"}</span></div>`;
        }
      } catch (e) {
        forensicsOutput.innerHTML += `<div class="terminal-line"><span class="terminal-error">❌ Network error to AWS: ${e.message}</span></div>`;
      }
      forensicsOutput.scrollTop = forensicsOutput.scrollHeight;
    });
  }

  // 4. Reports Dashboard — Real session data
  function updateReportDashboard() {
    if (typeof atomSession !== "undefined" && atomSession.currentSession) {
      document.getElementById("repStatTargets").textContent =
        atomSession.currentSession.targets.size;
      document.getElementById("repStatVulns").textContent =
        atomSession.currentSession.vulnerabilities.length;
      document.getElementById("repStatScans").textContent =
        atomSession.currentSession.findings.length;
    }
  }

  // 5. Vuln Scanner Setup
  const vulnBtn = document.getElementById("vulnLaunchBtn");
  if (vulnBtn) {
    vulnBtn.addEventListener("click", () => {
      const target = document.getElementById("vulnTarget").value.trim();
      const profile = document.getElementById("vulnProfile").value;

      if (!target) {
        alert("Please enter a target IP or Domain");
        return;
      }

      let cmd = "";
      if (profile === "fast") cmd = `nmap -F ${target}`;
      else if (profile === "deep") cmd = `nmap -sV -sC -p- ${target}`;
      else if (profile === "web") cmd = `nikto -h ${target}`;

      // Jump to terminal tab and run it
      document.querySelector('[data-tab="tab-ninja-engine"]').click();
      const terminalInput = document.getElementById("commandInput");
      const terminalExec = document.getElementById("executeBtn");

      terminalInput.value = cmd;
      terminalExec.click();
    });
  }

  // 6. Exploit DB — Real searchsploit on AWS EC2
  const exploitBtn = document.getElementById("exploitSearchBtn");
  const exploitInput = document.getElementById("exploitSearchTerm");
  const exploitRes = document.getElementById("exploitSearchResults");

  if (exploitBtn && exploitInput) {
    exploitBtn.addEventListener("click", async () => {
      const term = exploitInput.value.trim();
      if (!term) return;

      exploitRes.innerHTML = `<div class="terminal-line"><span class="terminal-prompt">atom@ninja:~#</span><span class="terminal-text">searchsploit "${term}"</span></div>`;
      exploitRes.innerHTML += `<div class="terminal-line"><span class="terminal-info">⚡ Querying ExploitDB on AWS EC2...</span></div>`;

      try {
        // Use the dedicated /api/tools/searchsploit endpoint on EC2
        const response = await fetch(
          `${CONFIG.BACKEND_API_URL}/tools/searchsploit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: term }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const output = data.result || "No exploits found for this query.";
          exploitRes.innerHTML += `<pre style="white-space:pre-wrap; font-family:monospace; font-size:12px; color:#10B981; max-height:350px; overflow-y:auto;">${output.substring(0, 3000)}</pre>`;
          if (data.stderr && data.stderr.trim()) {
            exploitRes.innerHTML += `<div class="terminal-line"><span class="terminal-warning">⚠️ ${data.stderr}</span></div>`;
          }
        } else {
          const errText = await response.text();
          exploitRes.innerHTML += `<div class="terminal-line"><span class="terminal-error">❌ searchsploit failed (${response.status}): ${errText}</span></div>`;
        }
      } catch (e) {
        exploitRes.innerHTML += `<div class="terminal-line"><span class="terminal-error">❌ Network error to AWS: ${e.message}</span></div>`;
      }
      exploitRes.scrollTop = exploitRes.scrollHeight;
    });

    exploitInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") exploitBtn.click();
    });
  }

  // 7. Origin Finder (WAF Bypass) — Real recon on AWS EC2
  const originBtn = document.getElementById("originDiscoverBtn");
  const originDomain = document.getElementById("originDomain");
  const originResults = document.getElementById("originResults");

  if (originBtn && originDomain) {
    originBtn.addEventListener("click", async () => {
      const domain = originDomain.value.trim();
      if (!domain) {
        alert("Please enter a target domain");
        return;
      }

      // Gather selected techniques
      const techniques = [...document.querySelectorAll(".origin-technique:checked")]
        .map((cb) => cb.value);
      if (techniques.length === 0) {
        alert("Select at least one recon technique");
        return;
      }

      originResults.classList.remove("hidden-on-load");
      originResults.style.display = "block";
      originBtn.disabled = true;
      originBtn.textContent = "⏳ Scanning...";

      originResults.innerHTML = `
        <div class="terminal-line"><span class="terminal-prompt">atom@ninja:~#</span><span class="terminal-text">🔍 Origin IP discovery for: ${domain}</span></div>
        <div class="terminal-line"><span class="terminal-info">⚡ Running ${techniques.length} recon techniques on AWS EC2...</span></div>
        <div class="terminal-line"><span class="terminal-info">🛡️ Techniques: ${techniques.join(", ")}</span></div>
        <div class="terminal-line"><span class="terminal-warning">⏳ This may take 30-90 seconds depending on target...</span></div>
      `;

      try {
        const response = await fetch(`${CONFIG.BACKEND_API_URL}/waf-bypass`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain, techniques }),
        });

        // Read as text first to prevent "Unexpected token '<'" crash
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          originResults.innerHTML += `<div class="terminal-line"><span class="terminal-error">❌ Server returned non-JSON (HTTP ${response.status}). EC2 may not be running.</span></div>`;
          return;
        }

        if (!response.ok) {
          originResults.innerHTML += `<div class="terminal-line"><span class="terminal-error">❌ ${data.error || "Unknown error"}${data.hint ? " — " + data.hint : ""}</span></div>`;
          return;
        }

        // Display Summary
        originResults.innerHTML += `
          <br><div class="terminal-line"><span class="terminal-text">═══════════════════════════════════════</span></div>
          <div class="terminal-line"><span class="terminal-success" style="font-size:15px; font-weight:700;">🎯 ORIGIN IP DISCOVERY RESULTS</span></div>
          <div class="terminal-line"><span class="terminal-text">═══════════════════════════════════════</span></div>
        `;

        // WAF Detection
        if (data.summary) {
          const s = data.summary;
          originResults.innerHTML += `
            <div class="terminal-line"><span class="terminal-info">🛡️ WAF Detected: <strong style="color:${s.wafDetected ? "#f97316" : "#22c55e"}">${s.wafDetected ? "YES — " + s.wafVendor : "No WAF detected"}</strong></span></div>
            <div class="terminal-line"><span class="terminal-info">📊 Candidate IPs: <strong>${s.totalCandidateIPs}</strong></span></div>
            <div class="terminal-line"><span class="terminal-info">🎯 Confirmed Origins: <strong style="color:#22c55e">${s.confirmedOriginIPs?.join(", ") || "None confirmed"}</strong></span></div>
            <div class="terminal-line"><span class="terminal-info">📈 Confidence: <strong style="color:${s.confidence === "HIGH" ? "#22c55e" : s.confidence === "MEDIUM" ? "#f59e0b" : "#ef4444"}">${s.confidence}</strong></span></div>
          `;
        }

        // Technique-by-technique results
        if (data.techniques) {
          for (const [name, tech] of Object.entries(data.techniques)) {
            const icon = {
              waf_detection: "🛡️", dns_enumeration: "📡",
              cert_transparency: "📜", historical_records: "📚",
              cloud_detection: "☁️", direct_probe: "🎯",
            }[name] || "🔧";

            originResults.innerHTML += `
              <br><div class="terminal-line"><span class="terminal-success">${icon} ${name.replace(/_/g, " ").toUpperCase()} [${tech.status}]</span></div>
            `;

            // Show key findings per technique
            if (name === "dns_enumeration" && tech.data?.subdomainIPs) {
              const subs = Object.entries(tech.data.subdomainIPs);
              if (subs.length > 0) {
                originResults.innerHTML += `<div class="terminal-line"><span class="terminal-text">  Subdomains resolving to non-CDN IPs:</span></div>`;
                subs.forEach(([sub, ips]) => {
                  originResults.innerHTML += `<div class="terminal-line"><span class="terminal-text" style="color:#10B981">  → ${sub}: ${ips.join(", ")}</span></div>`;
                });
              }
              if (tech.data.spfIPs?.length) {
                originResults.innerHTML += `<div class="terminal-line"><span class="terminal-text">  SPF IPs: ${tech.data.spfIPs.join(", ")}</span></div>`;
              }
            }

            if (name === "cert_transparency" && tech.data?.certCount) {
              originResults.innerHTML += `<div class="terminal-line"><span class="terminal-text">  Certificates found: ${tech.data.certCount}</span></div>`;
              originResults.innerHTML += `<div class="terminal-line"><span class="terminal-text">  Unique hostnames: ${tech.data.hostnames?.length || 0}</span></div>`;
            }

            if (name === "historical_records" && tech.data?.historicalIPs?.length) {
              originResults.innerHTML += `<div class="terminal-line"><span class="terminal-text">  Historical IPs: ${tech.data.historicalIPs.slice(0, 10).join(", ")}</span></div>`;
            }

            if (name === "cloud_detection" && tech.data?.originCandidates?.length) {
              originResults.innerHTML += `<div class="terminal-line"><span class="terminal-text" style="color:#10B981">  Non-CDN candidates: ${tech.data.originCandidates.join(", ")}</span></div>`;
            }

            if (name === "direct_probe" && tech.data?.confirmedOrigins?.length) {
              originResults.innerHTML += `<div class="terminal-line"><span class="terminal-success">  ✅ CONFIRMED ORIGINS: ${tech.data.confirmedOrigins.join(", ")}</span></div>`;
            }
          }
        }

        // AI Analysis
        if (data.aiAnalysis) {
          originResults.innerHTML += `
            <br><div class="terminal-line"><span class="terminal-text">═══════════════════════════════════════</span></div>
            <div class="terminal-line"><span class="terminal-success">🤖 AI Analysis</span></div>
            <div class="terminal-line"><span class="terminal-text">═══════════════════════════════════════</span></div>
            <pre style="white-space:pre-wrap; font-family:monospace; font-size:12px; color:#94a3b8; padding:8px;">${data.aiAnalysis}</pre>
          `;
        }

      } catch (e) {
        originResults.innerHTML += `<div class="terminal-line"><span class="terminal-error">❌ Network error: ${e.message}</span></div>`;
      } finally {
        originBtn.disabled = false;
        originBtn.textContent = "🔍 DISCOVER ORIGIN IP";
        originResults.scrollTop = originResults.scrollHeight;
      }
    });

    originDomain.addEventListener("keypress", (e) => {
      if (e.key === "Enter") originBtn.click();
    });
  }
}

// Call init once DOM is likely ready (we're deferred so this is fine, or hook to load)
window.addEventListener("load", () => {
  setTimeout(initArsenal, 500);
});
})();
