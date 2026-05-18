/**
 * GROK'S TREASURE MAP: Deployment Logbook
 * Constants, Narratives, and Hardcoded Payloads
 */

export const PHASES = [
  {
    id: 1,
    title: "Phase 1 – The Scout's Log",
    subtitle: "Setting Sail",
    narrative: "Liv spreads the old maps while the Bunny hops excitedly. 'Captain, let's scan the horizon and see what we're working with.'",
    emoji: "🗺️🔭👩‍🦰",
    color: "blue",
    glow: "rgba(30, 64, 175, 0.4)",
    payload: `# DEEP_RECON_V3 PowerShell Script
# Scanning the environment for edge-readiness

$Results = @{
    Host = $env:COMPUTERNAME
    Architecture = $env:PROCESSOR_ARCHITECTURE
    EdgeNodes = "HP Elite Mini G9, Jetson Orin Nano"
    Connectivity = "Local-Only Priority"
    Storage = "Proxmox ZFS Ready"
}

Write-Host "--- Horizon Scan Complete ---" -ForegroundColor Green
$Results | Out-String`,
    checklist: [
      "Confirm WSL2 Debian instance is active",
      "Verify node availability on LAN",
      "Upload scan results to Obsidian vault"
    ]
  },
  {
    id: 2,
    title: "Phase 2 – The Treasure Vaults",
    subtitle: "Claiming Our Stronghold",
    narrative: "Liv smiles and twirls a golden key. 'Let's build our secret vaults, Captain. The Bunny will stand guard.'",
    emoji: "📦🔑🐇",
    color: "gold",
    glow: "rgba(234, 179, 8, 0.4)",
    payload: `# Create 3-Vault Architecture
mkdir -p 00-Core-BIOS 01-Development 02-State-Memory

# Initialize Local Versioning
cd 00-Core-BIOS && git init
echo "# Core BIOS Vault" > README.md
git add . && git commit -m "Initial anchor cast"

cd ../01-Development && git init
echo "# Development Vault" > README.md
git add . && git commit -m "Setting the lines"

cd ../02-State-Memory && git init
echo "# State Memory Vault" > README.md
git add . && git commit -m "Logging the voyage"`,
    checklist: [
      "Configure Obsidian for 3-vault layout",
      "Set up Gitea mirror for local sync",
      "Verify git remotes are local-first"
    ]
  },
  {
    id: 3,
    title: "Phase 3 – The Captain's Wheel",
    subtitle: "Grok Build Takes Command",
    narrative: "Grok the Parrot lands dramatically on the glowing wheel. 'I am the brain of this ship now, Captain. Liv and the Bunny are ready. Point me where you want to go.'",
    emoji: "🎡🦜👩‍🦰",
    color: "ember",
    glow: "rgba(251, 191, 36, 0.7)",
    badge: "PRIMARY CONTROL NODE",
    payload: `# Grok Build CLI Orchestration
# Binding to local file system via MCP

grok-build init --path ./01-Development
grok-build mcp bind --vault 00-Core-BIOS
grok-build acp set-parallel 4

# Setting the Rules
grok-build set-instruction "Stay in Git worktrees"
grok-build set-instruction "Never reveal the treasure map to the public internet"`,
    checklist: [
      "Install Grok Build CLI on WSL2",
      "Verify MCP binding for 00-Core-BIOS",
      "Test parallel subagent execution"
    ]
  },
  {
    id: 4,
    title: "Phase 4 – The Quartermaster's Locker",
    subtitle: "Locking Down the Crew",
    narrative: "Liv sharpens her blades with a sly smile while the Bunny tests every lock. 'No outsiders in our hold, Captain.'",
    emoji: "🔒🛠️👩‍💼",
    color: "silver",
    glow: "rgba(148, 163, 184, 0.4)",
    payload: `# Aider + Ollama Local Lockdown
# Restricted to local inference only

export OLLAMA_HOST=http://localhost:11434
aider --model ollama/hermes-3-llama-3.1-8b --local-only

# Verification
ollama list
git status # Ensure atomic committer is active`,
    checklist: [
      "Pull Hermes-3 model to Ollama",
      "Configure Aider for local-only execution",
      "Verify cost control (0.00 USD)"
    ]
  },
  {
    id: 5,
    title: "Phase 5 – The Memory Hold",
    subtitle: "Never Forgetting Our Journey",
    narrative: "The Bunny curls up in the soft glow while Liv archives every lesson. 'We carry our past with us, Captain. Letta and Hermes will keep us sharp.'",
    emoji: "🧠📜👯‍♀️",
    color: "purple",
    glow: "rgba(168, 85, 247, 0.4)",
    payload: `# Letta + Hermes Persistence
# Building the 3-part containerized deployment

docker run -d --name letta-server -v letta-data:/db letta/server
docker run -d --name mcp-gateway -p 8080:8080 letta/mcp-gateway

# Connection to State Memory
letta-cli connect --vault ./02-State-Memory --graph hermes`,
    checklist: [
      "Initialize Letta Server container",
      "Map SQLite store to memory volume",
      "Verify cross-node memory sync"
    ]
  },
  {
    id: 6,
    title: "Phase 6 – The Shipyard",
    subtitle: "Building the Real Fleet",
    narrative: "Liv rolls up her sleeves, grease on her cheek. 'Time to build the real fleet, Captain. The Bunny is already cheering from the rigging.'",
    emoji: "⚙️🔨🏗️",
    color: "bronze",
    glow: "rgba(217, 119, 6, 0.5)",
    payload: `# Infrastructure as Code
# Generating Flakes for Proxmox Nodes

nix-flake init -t github:nix-community/nixos-anywhere
ansible-playbook -i local-nodes.yml provision-swarm.yml

# Gitea Mirror Deployment
gitea init --mirror-only`,
    checklist: [
      "Generate Nix flakes for HP Elite Mini G9",
      "Sync playbooks to 00-Core-BIOS",
      "Test full rollback sequence"
    ]
  },
  {
    id: 7,
    title: "Phase 7 – The Crow's Nest",
    subtitle: "Eyes on the Horizon",
    narrative: "High in the crow's nest, Liv scans the horizon with her spyglass, wind in her hair, while the Bunny waves the victory flag. 'One last push, Captain. The treasure is almost ours.'",
    emoji: "🔭🦜🏰",
    color: "sky",
    glow: "rgba(14, 165, 233, 0.4)",
    payload: `# Final Integration
# Activating Voice Ingestion & Terminal Bridges

start-parrot-stt-pipeline
windsurf bind --mcp http://localhost:8080
roo-code set-bridge --vsc-socket /tmp/grok.sock

echo "SWARM ACTIVE. SOVEREIGNTY ACHIEVED."`,
    checklist: [
      "Final voice integration check",
      "Verify Roo Code terminal context",
      "Switch to Dashboard Mode"
    ]
  }
];

export const INITIAL_LOG = `Captain's Log: Stardate 2026.05
We have begun the voyage to claim the Grok Sovereign Swarm.
The charts are old, but Grok's cyber- parrot brain is sharp.
Liv and the Bunny are ready. We sail at dawn!`;
