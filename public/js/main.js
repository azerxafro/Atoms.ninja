  // Launch console button
  launchBtn.addEventListener("click", () => {
    document.getElementById("commandInput").focus();
    document
      .querySelector(".demo-card")
      .scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Documentation button
  docsBtn.addEventListener("click", () => {
    addTerminalLine(
      "Documentation: Visit https://atoms.ninja/docs for reference",
      "info",
    );
  });

  // Add typing effect to command input
  commandInput.addEventListener("focus", () => {
    commandInput.style.transform = "scale(1.01)";
  });

  commandInput.addEventListener("blur", () => {
    commandInput.style.transform = "scale(1)";
  });
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
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
  const animatedElements = document.querySelectorAll(
    ".feature-card, .stat-item",
  );
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
    addTerminalLine(
      "Chat memory cleared. Starting fresh conversation.",
      "info",
    );
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
    console.log(
      "%c✓ New session started!",
      "color: #10B981; font-weight: bold;",
    );
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
    console.log(
      "%c  • exportSession() - Export session data",
      "color: #8B5CF6;",
    );
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
  const saveGeminiKey = document.getElementById("saveGeminiKey");
  const testMCPConnection = document.getElementById("testMCPConnection");
  const geminiApiKeyInput = document.getElementById("geminiApiKey");
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
      // Simulate connection test (replace with actual MCP server check)
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
      atomSession.currentSession.vulnerabilities.push(...data.vulnerabilities);
      atomSession.saveCurrentSession();

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
