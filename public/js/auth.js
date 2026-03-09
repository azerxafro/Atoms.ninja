// ═══════════════════════════════════════════════
//  Splash Screen + Discord Auth Flow
// ═══════════════════════════════════════════════

const ASCII_ART = [
  "  █████╗ ████████╗ ██████╗ ███╗   ███╗███████╗",
  " ██╔══██╗╚══██╔══╝██╔═══██╗████╗ ████║██╔════╝",
  " ███████║   ██║   ██║   ██║██╔████╔██║███████╗",
  " ██╔══██║   ██║   ██║   ██║██║╚██╔╝██║╚════██║",
  " ██║  ██║   ██║   ╚██████╔╝██║ ╚═╝ ██║███████║",
  " ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝╚══════╝",
  "      ███╗   ██╗██╗███╗   ██╗     ██╗ █████╗   ",
  "      ████╗  ██║██║████╗  ██║     ██║██╔══██╗  ",
  "      ██╔██╗ ██║██║██╔██╗ ██║     ██║███████║  ",
  "      ██║╚██╗██║██║██║╚██╗██║██   ██║██╔══██║  ",
  "      ██║ ╚████║██║██║ ╚████║╚█████╔╝██║  ██║  ",
  "      ╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚════╝ ╚═╝  ╚═╝  ",
];
const SPLASH_SUBTITLE = "AI SECURITY ARSENAL • A PRODUCT BY MONADELTA";

function isAuthenticated() {
  const stored = localStorage.getItem("discord_user");
  if (!stored) return false;
  try {
    const data = JSON.parse(stored);
    if (data.expiresAt && Date.now() > data.expiresAt) return false;
    return true;
  } catch (e) {
    return false;
  }
}

// Check cookie-based session (async, used as fallback)
async function checkCookieSession() {
  try {
    const res = await fetch("/api/auth/session", { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated && data.user) {
        // Hydrate localStorage from cookie for fast access
        localStorage.setItem("discord_user", JSON.stringify(data.user));
        return data.user;
      }
    }
  } catch (e) {}
  return null;
}

function initDiscordAuth() {
  // Handle OAuth callback first (before splash)
  handleAuthCallback();

  // Run splash animation
  playSplashAnimation(async () => {
    const splash = document.getElementById("splashScreen");
    splash.classList.add("fade-out");

    setTimeout(async () => {
      splash.style.display = "none";

      if (isAuthenticated()) {
        // Authenticated via localStorage → show main app
        showMainApp();
      } else {
        // Try cookie-based session (cross-subdomain)
        const cookieUser = await checkCookieSession();
        if (cookieUser) {
          showMainApp();
        } else {
          // Not authenticated → show login gate
          showLoginGate();
        }
      }
    }, 800);
  });

  // Sign out handler
  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", signOut);
  }
}

function playSplashAnimation(onComplete) {
  const artEl = document.getElementById("asciiArt");
  const subtitleEl = document.getElementById("splashSubtitle");
  const loaderBar = document.getElementById("loaderBar");
  const fullText = ASCII_ART.join("\n");
  let charIndex = 0;
  const totalChars = fullText.length;
  const charsPerFrame = 4;
  let progress = 0;

  function typeNextChars() {
    if (charIndex < totalChars) {
      const end = Math.min(charIndex + charsPerFrame, totalChars);
      artEl.textContent = fullText.substring(0, end);
      charIndex = end;
      progress = (charIndex / totalChars) * 100;
      loaderBar.style.width = progress + "%";

      // Random glitch flicker
      if (Math.random() < 0.05) {
        artEl.style.opacity = "0.7";
        setTimeout(() => {
          artEl.style.opacity = "1";
        }, 50);
      }

      requestAnimationFrame(typeNextChars);
    } else {
      // ASCII done — type subtitle
      loaderBar.style.width = "100%";
      typeSubtitle(subtitleEl, SPLASH_SUBTITLE, 0, () => {
        setTimeout(onComplete, 600);
      });
    }
  }

  requestAnimationFrame(typeNextChars);
}

function typeSubtitle(el, text, idx, onDone) {
  if (idx < text.length) {
    el.textContent = text.substring(0, idx + 1);
    setTimeout(() => typeSubtitle(el, text, idx + 1, onDone), 40);
  } else {
    onDone();
  }
}

function showLoginGate() {
  document.getElementById("loginGate").style.display = "flex";
  // Type the terminal message
  const typingEl = document.getElementById("loginTyping");
  const msg = "access denied. authenticate to proceed...";
  let i = 0;
  function typeChar() {
    if (i < msg.length) {
      typingEl.textContent = msg.substring(0, i + 1);
      i++;
      setTimeout(typeChar, 35);
    }
  }
  setTimeout(typeChar, 300);
}

function showMainApp() {
  document.getElementById("mainApp").style.display = "block";
  // Update nav auth UI
  const stored = localStorage.getItem("discord_user");
  if (stored) {
    try {
      updateAuthUI(JSON.parse(stored));
    } catch (e) {}
  }
  // Validate token in background
  validateSession();

  // Initialize Social features
  initDiscordSocial();
}

async function initDiscordSocial() {
  const stored = localStorage.getItem("discord_user");
  if (!stored) return;

  try {
    const userData = JSON.parse(stored);

    // Set initial activity
    await updateDiscordActivity({
      state: "Analyzing Systems",
      details: "In the Atoms Ninja Arsenal",
      assets: {
        largeImage: "logo",
        largeText: "Atoms Ninja",
      },
    });

    // Optionally fetch friends/relationships
    // const friends = await getDiscordRelationships();
    // console.log("Discord Friends:", friends);
  } catch (e) {
    console.error("Social init failed:", e);
  }
}

async function updateDiscordActivity(activity) {
  const stored = localStorage.getItem("discord_user");
  if (!stored) return;

  try {
    const userData = JSON.parse(stored);
    const response = await fetch("/api/auth/social/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userData.accessToken}`,
      },
      body: JSON.stringify(activity),
    });
    return await response.json();
  } catch (e) {
    console.error("Failed to update activity:", e);
  }
}

async function getDiscordRelationships() {
  const stored = localStorage.getItem("discord_user");
  if (!stored) return [];

  try {
    const userData = JSON.parse(stored);
    const response = await fetch("/api/auth/social/relationships", {
      headers: { Authorization: `Bearer ${userData.accessToken}` },
    });
    if (response.ok) return await response.json();
  } catch (e) {
    console.error("Failed to fetch relationships:", e);
  }
  return [];
}

function handleAuthCallback() {
  const params = new URLSearchParams(window.location.search);

  const authData = params.get("discord_auth");
  if (authData) {
    try {
      const userData = JSON.parse(atob(decodeURIComponent(authData)));
      localStorage.setItem("discord_user", JSON.stringify(userData));
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      console.error("Failed to parse auth data:", e);
    }
  }

  const authError = params.get("auth_error");
  if (authError) {
    console.error("Discord auth error:", authError);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function validateSession() {
  const stored = localStorage.getItem("discord_user");
  if (!stored) return;

  try {
    const userData = JSON.parse(stored);
    if (userData.expiresAt && Date.now() > userData.expiresAt) {
      signOut();
      return;
    }

    const response = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${userData.accessToken}` },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.authenticated) {
        userData.username = data.user.username;
        userData.globalName = data.user.globalName;
        userData.avatar = data.user.avatar;
        localStorage.setItem("discord_user", JSON.stringify(userData));
        updateAuthUI(userData);
        return;
      }
    }
    signOut();
  } catch (e) {
    // Network error — use cached if not expired
    try {
      const userData = JSON.parse(stored);
      if (userData.expiresAt && Date.now() < userData.expiresAt) {
        updateAuthUI(userData);
      }
    } catch (e2) {
      signOut();
    }
  }
}

function updateAuthUI(userData) {
  const loginBtn = document.getElementById("discordLoginBtn");
  const profileDiv = document.getElementById("userProfile");
  const avatarImg = document.getElementById("userAvatar");
  const nameSpan = document.getElementById("userName");

  if (userData) {
    if (loginBtn) loginBtn.style.display = "none";
    if (profileDiv) profileDiv.style.display = "flex";
    if (avatarImg) avatarImg.src = userData.avatar;
    if (nameSpan)
      nameSpan.textContent = userData.globalName || userData.username;
  } else {
    if (loginBtn) loginBtn.style.display = "flex";
    if (profileDiv) profileDiv.style.display = "none";
  }
}

async function signOut() {
  localStorage.removeItem("discord_user");
  // Clear cross-subdomain cookie
  try {
    await fetch("/api/auth/signout", { credentials: "include" });
  } catch (e) {}
  updateAuthUI(null);
  // Show login gate again
  document.getElementById("mainApp").style.display = "none";
  document.getElementById("loginGate").style.display = "flex";
}

// Initialize auth + splash
initDiscordAuth();
