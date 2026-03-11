# Project Structure

## Root Directory Layout

```
atoms.ninja/
├── api/                    # Vercel serverless API endpoints
├── docs/                   # Comprehensive documentation
├── examples/               # Demo scripts and examples
├── frontend/               # Alternative frontend implementation
├── lib/                    # Core library modules
├── my-workflow-app/        # Next.js workflow application
├── public/                 # Static frontend assets
├── scripts/                # Deployment and setup scripts
├── tests/                  # Test suites and validation
├── atoms-server.js         # Main backend server
├── index.html              # Primary web interface
└── vercel.json             # Vercel deployment configuration
```

## Core Components

### Backend Server (`atoms-server.js`)
- **Purpose**: Unified AI + Kali security backend
- **Responsibilities**:
  - Tool execution engine with whitelisting
  - AI integration (OpenRouter/Venice)
  - Command validation and security
  - Rate limiting and CORS handling
- **Key Features**:
  - 500+ whitelisted Kali commands
  - Sudo privilege management
  - Tool-specific timeout controls
  - Dangerous pattern blocking

### API Layer (`/api`)
- `index.js` - Main API proxy for production
- `beta.js` - Beta environment API handler
- Routes AI requests to backend
- Handles authentication and session management

### Frontend (`/public/js`)
- `terminal.js` - Terminal interface and command execution
- `main.js` - Application initialization and UI logic
- `auth.js` - Discord OAuth authentication
- `session.js` - Session state management
- `config.js` - Frontend configuration

### Library Modules (`/lib`)
- `ai-core.js` - AI integration and prompt engineering
- `mcp-servers.js` - MCP server management
- `google-admin.js` - Google Workspace Admin SDK integration
- `discord-social.js` - Discord API integration
- `lab-sandbox.js` - Sandbox environment utilities
- `self-trainer.js` - AI self-training capabilities

### Deployment Scripts (`/scripts`)
- `deploy-vercel.sh` - Vercel deployment automation
- `deploy-mcp.sh` - MCP server deployment
- `create-kali-vm.sh` - GCP Kali VM provisioning
- `gcp-kali-setup.sh` - Kali environment setup
- `install-kali-tools.sh` - Tool installation automation
- `setup-aws-waf.sh` - AWS WAF configuration
- `update-security-group.sh` - Security group management

### Documentation (`/docs`)
- Architecture diagrams and system design
- Deployment guides and checklists
- Security documentation
- API verification guides
- Debugging and troubleshooting

## Architectural Patterns

### Three-Tier Architecture
1. **Presentation Layer**: HTML/CSS/JS terminal interface
2. **Application Layer**: Express.js API with AI orchestration
3. **Execution Layer**: GCP Kali Linux VM with security tools

### Request Flow
```
User Input → Frontend (index.html)
          → API Proxy (/api/index.js)
          → Backend (atoms-server.js)
          → AI Analysis (Multi-AI/OpenRouter)
          → Tool Execution (Kali VM)
          → Response Chain
```

### Security Model
- **Whitelist-based**: Only approved commands execute
- **Privilege Escalation**: Automatic sudo for privileged tools
- **Pattern Blocking**: Dangerous commands rejected
- **Rate Limiting**: 200 requests per 15 minutes
- **CORS Protection**: Origin validation

### AI Integration Pattern
- **Dual Provider**: Venice (primary) + OpenRouter (fallback)
- **Prompt Engineering**: Task-specific system prompts
- **Thinking Chain**: Transparent AI reasoning
- **Auto-execution**: JSON command parsing and execution

## Configuration Files

- `config.js` - Dynamic frontend configuration
- `shared-config.js` - Shared constants and origins
- `vercel.json` - Vercel routing and build config
- `package.json` - Dependencies and scripts
- `.env` - Environment variables (API keys, endpoints)

## Deployment Targets

- **Production**: atoms.ninja (Vercel)
- **Beta**: beta.atoms.ninja (Vercel)
- **Backend**: GCP Compute Engine (Kali VM)
- **API**: Vercel Serverless Functions
