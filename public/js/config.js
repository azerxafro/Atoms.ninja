  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Configuration - Always use www.atoms.ninja
  const CONFIG = {
    BACKEND_API_URL: "https://www.atoms.ninja/api",
    KALI_MCP_ENDPOINT: "https://www.atoms.ninja/api/kali",
    AI_ENDPOINT: "https://www.atoms.ninja/api/multi-ai", // Multi-AI via OpenRouter
    AI_HEALTH_ENDPOINT: "https://www.atoms.ninja/api/ai-health",
    AI_MODE: "fast", // fast | accurate | stealth
  };
