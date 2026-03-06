  // Enhanced Session Manager with persistence
  class SessionManager {
    constructor() {
      this.sessions = this.loadSessions();
      this.currentSession = this.loadCurrentSession();
    }

    loadSessions() {
      try {
        const saved = localStorage.getItem("atom_sessions");
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }

    saveSessions() {
      localStorage.setItem("atom_sessions", JSON.stringify(this.sessions));
    }

    loadCurrentSession() {
      try {
        const saved = localStorage.getItem("atom_current_session");
        if (saved) return JSON.parse(saved);
      } catch (e) {}

      const newSession = {
        id: Date.now(),
        name: `Session ${new Date().toLocaleString()}`,
        created: new Date().toISOString(),
        targets: [],
        scans: [],
        vulnerabilities: [],
        riskScore: 0,
      };
      this.saveCurrentSession(newSession);
      return newSession;
    }

    saveCurrentSession(session = this.currentSession) {
      localStorage.setItem("atom_current_session", JSON.stringify(session));
    }

    addScan(command, output, vulnerabilities = []) {
      this.currentSession.scans.push({
        timestamp: new Date().toISOString(),
        command,
        output,
        vulnerabilities,
      });

      if (vulnerabilities.length > 0) {
        this.currentSession.vulnerabilities.push(...vulnerabilities);
        this.updateRiskScore();
      }

      this.saveCurrentSession();
    }

    addTarget(target) {
      if (!this.currentSession.targets.includes(target)) {
        this.currentSession.targets.push(target);
        this.saveCurrentSession();
      }
    }

    updateRiskScore() {
      let score = 0;
      for (const vuln of this.currentSession.vulnerabilities) {
        if (vuln.severity === "CRITICAL") score += 10;
        else if (vuln.severity === "HIGH") score += 7;
        else if (vuln.severity === "MEDIUM") score += 4;
        else if (vuln.severity === "LOW") score += 2;
      }
      this.currentSession.riskScore = Math.min(100, score);
    }

    exportReport() {
      const report = {
        session: this.currentSession,
        exported: new Date().toISOString(),
        summary: {
          totalScans: this.currentSession.scans.length,
          totalTargets: this.currentSession.targets.length,
          totalVulnerabilities: this.currentSession.vulnerabilities.length,
          riskScore: this.currentSession.riskScore,
          criticalVulns: this.currentSession.vulnerabilities.filter(
            (v) => v.severity === "CRITICAL",
          ).length,
        },
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atom-report-${Date.now()}.json`;
      a.click();

      addTerminalLine(`📄 Report exported: ${a.download}`, "success");
    }
  }

  const atomSession = new SessionManager();
