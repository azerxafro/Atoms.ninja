// Section Navigation Logic
document.addEventListener("DOMContentLoaded", () => {
  const sidebarItems = document.querySelectorAll(".sidebar-item[data-section]");
  const sectionPanels = document.querySelectorAll(".section-panel");
  const sidebar = document.querySelector(".sidebar");
  const menuToggle = document.getElementById("menuToggle");

  const sessionTitle = document.querySelector(".current-session-title");

  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetSectionId = item.getAttribute("data-section");
      const targetSection = document.getElementById(targetSectionId);

      if (targetSection) {
        // Update active sidebar item
        sidebarItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        // Update Header Title based on section or item text
        if (sessionTitle) {
          const itemText = item.querySelector("span")
            ? item.querySelector("span").innerText
            : item.innerText;
          sessionTitle.innerText =
            itemText === "Console" ? "Security Console" : itemText;
        }

        // Update active section panel with fade effect
        sectionPanels.forEach((panel) => {
          panel.classList.remove("active");
          panel.style.display = "none";
          panel.style.opacity = "0";
          panel.style.visibility = "hidden"; // Ensure hidden panels don't interfere
        });

        targetSection.style.display = "block";
        targetSection.style.visibility = "visible";
        // Trigger reflow for transition
        targetSection.offsetHeight;
        targetSection.classList.add("active");
        targetSection.style.opacity = "1";

        // Scroll to top of new section
        targetSection.scrollTop = 0;

        // Auto-close mobile sidebar
        if (window.innerWidth < 768 && sidebar && menuToggle) {
          gsap.to(sidebar, { x: -280, duration: 0.5, ease: "power4.in" });
          menuToggle.classList.remove("active");
          const overlay = document.querySelector(".sidebar-overlay");
          if (overlay) overlay.classList.remove("active");
        }
      }
    });
  });
});

// Smooth scroll for navigation links (legacy/internal links)
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const href = this.getAttribute("href");
    if (href === "#") return;

    // Check if target is a section we should switch to
    const sectionTarget = document.querySelector(
      `.sidebar-item[data-section="section-${href.replace("#", "")}"]`,
    );
    if (sectionTarget) {
      sectionTarget.click();
      return;
    }

    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
});

// GSAP Initialization
gsap.registerPlugin(ScrollTrigger);

// Entrance Animations
window.addEventListener("DOMContentLoaded", () => {
  // Initial reveals
  tl.to(".app-shell", { opacity: 1, duration: 0.1 })
    .from(".sidebar", { x: -300, opacity: 0, duration: 1, ease: "expo.out" })
    .from(".sidebar .logo", { opacity: 0, y: -20 }, "-=0.6")
    .from(".new-chat-btn", { scale: 0.9, opacity: 0 }, "-=0.4")
    .from(".history-item", { x: -20, opacity: 0, stagger: 0.05 }, "-=0.4")
    .from(".chat-main", { opacity: 0, duration: 1 }, "-=1")
    .from(".header", { y: -50, opacity: 0 }, "-=0.8")
    .from(".demo-card", { y: 30, opacity: 0, duration: 1 }, "-=0.6");

  // Sidebar Toggle (Mobile)
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.querySelector(".sidebar");
  let sidebarOpen = false;

  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  document.body.appendChild(overlay);

  function toggleSidebar(forceClose = false) {
    if (forceClose) sidebarOpen = false;
    else sidebarOpen = !sidebarOpen;

    if (sidebarOpen) {
      gsap.to(sidebar, { x: 0, duration: 0.5, ease: "power4.out" });
      menuToggle.classList.add("active");
      overlay.classList.add("active");
    } else {
      gsap.to(sidebar, { x: -280, duration: 0.5, ease: "power4.in" });
      menuToggle.classList.remove("active");
      overlay.classList.remove("active");
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", () => toggleSidebar());
  }

  overlay.addEventListener("click", () => toggleSidebar(true));

  // New Chat Button
  const newChatBtn = document.getElementById("newChatBtn");
  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      terminalOutput.innerHTML = "";
      addTerminalLine("Atoms Ninja Security Console initialized.", "success");
      commandInput.value = "";
      commandInput.focus();
      if (window.innerWidth < 768) {
        gsap.to(sidebar, { x: -280, duration: 0.5 });
        sidebarOpen = false;
        if (menuToggle) menuToggle.classList.remove("active");
        const overlay = document.querySelector(".sidebar-overlay");
        if (overlay) overlay.classList.remove("active");
      }
    });
  }
});

// Configuration — auto-detect environment
const isLocalDev =
  window.location.protocol === "file:" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const CONFIG = {
  BACKEND_API_URL: isLocalDev
    ? "http://localhost:3001"
    : window.location.origin, // Same-origin in production (www.atoms.ninja or beta.atoms.ninja)
  KALI_MCP_ENDPOINT: isLocalDev
    ? "http://localhost:3001"
    : `${window.location.origin}/api/kali`, // Vercel proxy → EC2
};

// Terminal functionality
const commandInput = document.getElementById("commandInput");
const executeBtn = document.getElementById("executeBtn");
const terminalOutput = document.getElementById("terminalOutput");
const launchBtn = document.getElementById("launchBtn");
const docsBtn = document.getElementById("docsBtn");

let isExecuting = false;
let commandHistory = [];
let historyIndex = -1;

// Advanced AI Memory System
let chatHistory = [];
const MAX_CHAT_HISTORY = 20; // Increased from 10
let currentSession = {
  id: Date.now(),
  startTime: new Date().toISOString(),
  targets: new Set(),
  findings: [],
  toolsUsed: new Set(),
  vulnerabilities: [],
  recommendations: [],
};

// Session Management
function startNewSession() {
  currentSession = {
    id: Date.now(),
    startTime: new Date().toISOString(),
    targets: new Set(),
    findings: [],
    toolsUsed: new Set(),
    vulnerabilities: [],
    recommendations: [],
  };
  localStorage.setItem(
    "atomsNinjaCurrentSession",
    JSON.stringify(currentSession, (key, value) => {
      if (value instanceof Set) return Array.from(value);
      return value;
    }),
  );
}

// Load current session
function loadCurrentSession() {
  const saved = localStorage.getItem("atomsNinjaCurrentSession");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      currentSession = {
        ...data,
        targets: new Set(data.targets),
        toolsUsed: new Set(data.toolsUsed),
      };
    } catch (e) {
      console.error("Failed to load session:", e);
    }
  }
}

// Extract and track targets from commands
function trackTarget(command) {
  // Extract IPs, domains, and URLs
  const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const domainPattern = /\b[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}\b/gi;
  const urlPattern = /https?:\/\/[^\s]+/gi;

  const ips = command.match(ipPattern) || [];
  const domains = command.match(domainPattern) || [];
  const urls = command.match(urlPattern) || [];

  [...ips, ...domains, ...urls].forEach((target) => {
    currentSession.targets.add(target);
  });

  saveSession();
}

// Save finding from scan results
function saveFinding(tool, target, result) {
  const finding = {
    timestamp: new Date().toISOString(),
    tool: tool,
    target: target,
    result: result.substring(0, 500), // Store first 500 chars
    hash: btoa(tool + target + Date.now()), // Unique ID
  };

  currentSession.findings.push(finding);
  currentSession.toolsUsed.add(tool);

  // Auto-detect vulnerabilities
  detectVulnerabilities(result);

  saveSession();
}

// Detect vulnerabilities from scan results
function detectVulnerabilities(result) {
  const vulnPatterns = [
    { pattern: /SQL injection/i, type: "SQL Injection", severity: "high" },
    { pattern: /XSS|Cross-Site Scripting/i, type: "XSS", severity: "high" },
    { pattern: /open port|port.*open/i, type: "Open Port", severity: "medium" },
    {
      pattern: /vulnerable|exploitable/i,
      type: "Potential Vulnerability",
      severity: "medium",
    },
    {
      pattern: /weak|default password/i,
      type: "Weak Credentials",
      severity: "high",
    },
    {
      pattern: /outdated|old version/i,
      type: "Outdated Software",
      severity: "medium",
    },
  ];

  vulnPatterns.forEach(({ pattern, type, severity }) => {
    if (pattern.test(result)) {
      currentSession.vulnerabilities.push({
        type: type,
        severity: severity,
        timestamp: new Date().toISOString(),
        details: result.substring(0, 200),
      });
    }
  });
}

// Save session
function saveSession() {
  localStorage.setItem(
    "atomsNinjaCurrentSession",
    JSON.stringify(currentSession, (key, value) => {
      if (value instanceof Set) return Array.from(value);
      return value;
    }),
  );
}

// Generate session summary
function getSessionSummary() {
  return `
SESSION INTELLIGENCE:
• Targets Scanned: ${currentSession.targets.size} (${Array.from(currentSession.targets).join(", ")})
• Tools Used: ${Array.from(currentSession.toolsUsed).join(", ")}
• Findings: ${currentSession.findings.length} total
• Vulnerabilities Found: ${currentSession.vulnerabilities.length}
• Session Duration: ${Math.round((Date.now() - currentSession.id) / 1000 / 60)} minutes
`;
}

// Enhanced chat interaction saving
function saveChatInteraction(
  userInput,
  aiResponse,
  commandExecuted = null,
  scanResult = null,
) {
  const interaction = {
    timestamp: new Date().toISOString(),
    user: userInput,
    ai: aiResponse,
    command: commandExecuted,
    scanResult: scanResult ? scanResult.substring(0, 300) : null,
  };

  chatHistory.push(interaction);

  // Track targets from command
  if (commandExecuted) {
    trackTarget(commandExecuted);

    // Extract tool name
    const tool = commandExecuted.split(" ")[0];
    if (scanResult) {
      saveFinding(tool, "extracted-target", scanResult);
    }
  }

  // Keep only last MAX_CHAT_HISTORY interactions
  if (chatHistory.length > MAX_CHAT_HISTORY) {
    chatHistory.shift();
  }

  // Save to localStorage
  localStorage.setItem("atomsNinjaChatHistory", JSON.stringify(chatHistory));
}

// Load chat history from localStorage
function loadChatHistory() {
  const saved = localStorage.getItem("atomsNinjaChatHistory");
  if (saved) {
    try {
      chatHistory = JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load chat history:", e);
      chatHistory = [];
    }
  }
}

// Advanced context with session intelligence
function getChatContext() {
  if (chatHistory.length === 0) return "";

  // Recent conversation
  const recentContext = chatHistory
    .slice(-5)
    .map((interaction) => {
      let ctx = `User: ${interaction.user}\nAI: ${interaction.ai.substring(0, 200)}`;
      if (interaction.command) {
        ctx += `\nExecuted: ${interaction.command}`;
      }
      if (interaction.scanResult) {
        ctx += `\nResult: ${interaction.scanResult.substring(0, 100)}...`;
      }
      return ctx;
    })
    .join("\n---\n");

  // Session intelligence
  const sessionIntel = getSessionSummary();

  return `
RECENT CONVERSATION HISTORY:
${recentContext}

${sessionIntel}

INSTRUCTIONS:
- Use conversation history to maintain context
- Reference previous scans and findings
- Suggest next logical steps based on what's been done
- If user asks "what did we find?", summarize session findings
- If vulnerabilities detected, prioritize mentioning them
- Track the progression: Recon → Enumeration → Exploitation → Post-Exploitation
`;
}

// Add terminal line
function addTerminalLine(text, type = "text") {
  const line = document.createElement("div");
  line.className = "terminal-line";

  const prompt = document.createElement("span");
  prompt.className = "terminal-prompt";
  prompt.textContent = "root@atomsninja:~#";

  const textSpan = document.createElement("span");
  textSpan.className = `terminal-${type}`;
  textSpan.textContent = text;

  line.appendChild(prompt);
  line.appendChild(textSpan);

  // Remove cursor before adding new line
  const cursor = terminalOutput.querySelector(".terminal-cursor");
  if (cursor) cursor.remove();

  terminalOutput.appendChild(line);

  // Add cursor back
  const newCursor = document.createElement("div");
  newCursor.className = "terminal-cursor";
  newCursor.textContent = "_";
  terminalOutput.appendChild(newCursor);

  // Scroll to bottom
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Execute command
async function executeCommand(command) {
  if (isExecuting || !command.trim()) return;

  isExecuting = true;
  executeBtn.textContent = "Executing...";
  executeBtn.style.opacity = "0.7";

  // Add command to history
  commandHistory.unshift(command);
  historyIndex = -1;

  // Display the command
  addTerminalLine(`Executing: ${command}`, "info");

  // Parse and execute command
  const result = await processCommand(command);
  addTerminalLine(result.message, result.type);

  // Clear input
  commandInput.value = "";

  isExecuting = false;
  executeBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Execute
    `;
  executeBtn.style.opacity = "1";
}

// Process commands with intelligent routing
async function processCommand(command) {
  const cmd = command.toLowerCase().trim();

  // List of Kali tools that should be executed directly
  const kaliTools = [
    "nmap",
    "masscan",
    "nikto",
    "dirb",
    "dirbuster",
    "sqlmap",
    "hydra",
    "john",
    "hashcat",
    "metasploit",
    "msfconsole",
    "searchsploit",
    "aircrack",
    "wireshark",
    "tcpdump",
    "ettercap",
    "burp",
    "burpsuite",
    "wpscan",
    "whatweb",
    "whois",
    "dig",
    "host",
    "setoolkit",
    "volatility",
    "autopsy",
    "foremost",
    "hping3",
    "medusa",
    "xsser",
    "commix",
    "openvas",
    "lynis",
    "reaver",
    "wifite",
    "armitage",
  ];

  // Check if command starts with any Kali tool
  const isDirectCommand = kaliTools.some((tool) => cmd.startsWith(tool));

  if (isDirectCommand) {
    // Route ALL recognized tools through real execution — no fakes
    const toolName = cmd.split(/\s+/)[0];
    return await executeSecurityTool(command, toolName);
  } else if (cmd === "help") {
    return {
      message:
        '🥷 I\'m your AI security architect!\n\nYou can:\n• Ask questions: "what is SQL injection?"\n• Run tools: "scan 192.168.1.1" or "sqlmap -u http://site"\n• Natural language: "find vulnerabilities on example.com"\n\nSupported tools: nmap, sqlmap, nikto, hydra, metasploit, burp, wireshark, and 30+ more!',
      type: "info",
    };
  } else {
    // Everything else goes to AI for natural language processing
    return await processWithAI(command);
  }
}

// Generic security tool executor for ALL Kali tools
async function executeSecurityTool(command, toolName) {
  addTerminalLine(`🔧 Initializing ${toolName}...`, "info");
  addTerminalLine(`⚡ Executing: ${command}`, "info");
  addTerminalLine("🔍 Connecting to Kali MCP, Chief...", "info");

  try {
    // Parse command into tool and arguments
    const parts = command.trim().split(/\s+/);
    const tool = parts[0]; // First part is the tool name
    const args = parts.slice(1); // Rest are arguments

    // Use proxy endpoint in production, direct in dev
    const endpoint = CONFIG.KALI_MCP_ENDPOINT.includes("/api/kali")
      ? `${CONFIG.KALI_MCP_ENDPOINT}/execute`
      : `${CONFIG.KALI_MCP_ENDPOINT}/api/execute`;

    console.log("🔧 DEBUG - Tool:", tool, "Args:", args);
    console.log("🔧 DEBUG - Endpoint:", endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command: tool,
        args: args,
      }),
    });

    console.log("🔧 DEBUG - Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🔧 DEBUG - Error response:", errorText);
      throw new Error(`MCP returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("🔧 DEBUG - Response data:", data);

    if (data.stderr && data.stderr.trim()) {
      return {
        message: `⚠️ ${toolName} warning:\n${data.stderr}\n\n${data.result || data.stdout || ""}`,
        type: "warning",
      };
    }

    return {
      message: `✅ ${toolName} complete:\n\n${data.result || data.stdout || "Command executed successfully"}`,
      type: "success",
    };
  } catch (error) {
    console.error("🔧 DEBUG - Full error:", error);
    return {
      message: `❌ ${toolName} failed: ${error.message}`,
      type: "error",
    };
  }
}

// Process with AI — calls /api/multi-ai which auto-executes on backend
async function processWithAI(command) {
  try {
    addTerminalLine("🤖 Atom analyzing...", "info");

    // Build session context for the backend
    const sessionData = {
      targets: Array.from(currentSession.targets),
      findings: currentSession.findings.slice(-5),
      toolsUsed: Array.from(currentSession.toolsUsed),
      vulnerabilities: currentSession.vulnerabilities.slice(-5),
    };

    // Build chat history in OpenAI message format for the backend
    const recentHistory = chatHistory.slice(-8).flatMap((interaction) => {
      const msgs = [{ role: "user", content: interaction.user }];
      if (interaction.ai) msgs.push({ role: "assistant", content: interaction.ai });
      return msgs;
    });

    const response = await fetch(`${CONFIG.BACKEND_API_URL}/api/multi-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: command,
        chatHistory: recentHistory,
        sessionData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 503) {
        throw new Error("Backend server unreachable. Run: npm start");
      }
      throw new Error(errorData.error || `Backend error: ${response.status}`);
    }

    const data = await response.json();

    // Display thinking chain if present
    if (data.thinking && Array.isArray(data.thinking)) {
      data.thinking.forEach((step) => {
        addTerminalLine(`${step.title}: ${step.content}`, "info");
      });
    }

    // CASE 1: Backend auto-executed the command and returned real output
    if (data.autoExecute && data.toolOutput) {
      addTerminalLine(`⚡ Executed: ${data.autoExecute.command}`, "info");

      const output = data.toolOutput.result || data.toolOutput.stderr || "No output";
      saveChatInteraction(command, data.autoExecute.explanation, data.autoExecute.command, output);

      return {
        message: `✅ ${data.autoExecute.explanation || "Complete"}:\n\n${output}`,
        type: data.toolOutput.exitCode === 0 ? "success" : "warning",
      };
    }

    // CASE 2: Backend parsed a command but couldn't execute (no EC2) — execute via MCP
    if (data.autoExecute && data.autoExecute.command) {
      addTerminalLine(`⚡ Executing: ${data.autoExecute.command}`, "info");
      const result = await executeSecurityTool(data.autoExecute.command, data.autoExecute.command.split(/\s+/)[0]);
      saveChatInteraction(command, data.autoExecute.explanation, data.autoExecute.command, result.message);
      return result;
    }

    // CASE 3: Text response — check if it contains a hidden JSON command
    const aiResponse = data.response || "";
    const jsonMatch = aiResponse.match(/\{[\s\S]*"action"\s*:\s*"execute"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.action === "execute" && parsed.command) {
          addTerminalLine(`⚡ Executing: ${parsed.command}`, "info");
          const result = await executeSecurityTool(parsed.command, parsed.command.split(/\s+/)[0]);
          saveChatInteraction(command, parsed.explanation, parsed.command, result.message);
          return result;
        }
      } catch (e) { /* not valid JSON */ }
    }

    // CASE 4: Pure conversation response
    saveChatInteraction(command, aiResponse);
    return {
      message: `🤖 Atom: ${aiResponse}`,
      type: "success",
    };
  } catch (error) {
    console.error("AI Error:", error);
    return {
      message: `❌ ${error.message}`,
      type: "error",
    };
  }
}

// Execute button handler
executeBtn.addEventListener("click", () => {
  executeCommand(commandInput.value);
});

// Enter key to execute
commandInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    executeCommand(commandInput.value);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      commandInput.value = commandHistory[historyIndex];
    }
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    if (historyIndex > 0) {
      historyIndex--;
      commandInput.value = commandHistory[historyIndex];
    } else if (historyIndex === 0) {
      historyIndex = -1;
      commandInput.value = "";
    }
  }
});

// Launch console button
// Launch console button
if (launchBtn) {
  launchBtn.addEventListener("click", () => {
    commandInput.focus();
    document
      .querySelector(".demo-card")
      .scrollIntoView({ behavior: "smooth", block: "center" });
    // Pulse animation on the card
    gsap.to(".demo-card", {
      scale: 1.01,
      duration: 0.3,
      repeat: 1,
      yoyo: true,
    });
  });
}

// Documentation button
docsBtn.addEventListener("click", () => {
  addTerminalLine(
    "Documentation: Visit https://www.kali.org/docs/ for Kali Linux tools reference",
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
  "%cPowered by Kali Linux MCP & Multi-AI Engine",
  "font-size: 12px; color: #8B5CF6;",
);

// API Configuration Helper
window.setAIAPIKey = function (apiKey) {
  CONFIG.AI_API_KEY = apiKey;
  console.log(
    "%c✓ AI API Key configured successfully!",
    "color: #10B981; font-weight: bold;",
  );
  addTerminalLine("AI provider authentication successful.", "success");
};

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
    '%cTo enable AI features, run: setAIAPIKey("your-api-key-here")',
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

// Open settings modal
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("active");
  // Load saved values
  if (CONFIG.AI_API_KEY) {
    aiApiKeyInput.value = CONFIG.AI_API_KEY;
  }
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

// Save AI API Key
saveAiKey.addEventListener("click", () => {
  const apiKey = aiApiKeyInput.value.trim();
  const statusDiv = document.getElementById("apiKeyStatus");

  if (!apiKey) {
    statusDiv.className = "status-message error";
    statusDiv.textContent = "❌ Please enter a valid API key";
    return;
  }

  CONFIG.AI_API_KEY = apiKey;
  if (typeof AtomsNinjaConfig !== "undefined") {
    AtomsNinjaConfig.ai.apiKey = apiKey;
  }

  // Save to localStorage
  localStorage.setItem("ai_api_key", apiKey);

  statusDiv.className = "status-message success";
  statusDiv.textContent =
    "✅ API key saved successfully! AI features are now enabled.";

  addTerminalLine("AI provider configured and ready.", "success");

  setTimeout(() => {
    statusDiv.style.display = "none";
  }, 5000);
});

// Test MCP Connection
testMCPConnection.addEventListener("click", async () => {
  const endpoint = mcpEndpointInput.value.trim();
  const statusDiv = document.getElementById("mcpStatus");

  statusDiv.className = "status-message info";
  statusDiv.textContent = "🔄 Testing connection...";

  try {
    // Real connection test to MCP health endpoint
    const healthUrl = endpoint.replace(/\/+$/, "") + "/health";
    const resp = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) throw new Error(`Status ${resp.status}`);
    const healthData = await resp.json();

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
  const savedApiKey = localStorage.getItem("ai_api_key");
  const savedEndpoint = localStorage.getItem("mcp_endpoint");

  if (savedApiKey) {
    CONFIG.AI_API_KEY = savedApiKey;
    if (typeof AtomsNinjaConfig !== "undefined") {
      AtomsNinjaConfig.ai.apiKey = savedApiKey;
    }
    addTerminalLine("Loaded saved AI API configuration.", "info");
  }

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
