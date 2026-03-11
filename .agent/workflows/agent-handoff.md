---
description: Formal protocol for handoffs between Trinity agents.
---

# Agent Handoff Protocol

1. **Context Export**: The outgoing agent must provide a summary of work done and current state.
2. **Tool Status**: Report any running processes on AWS EC2.
3. **Requirement Mapping**: Ensure the next agent understands the Chief's specific constraints.
4. **Acknowledgement**: The incoming agent confirms they have read the `instructions.md` and are ready for VICTORY.
