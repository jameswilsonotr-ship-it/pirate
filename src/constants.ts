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
    ],
    videoPrompt: "Cinematic retro 1985 pirate fantasy art: At dawn on the ship's deck, Liv, an elegant female navigator with flowing hair, looks through a golden spyglass while a playful mascot 'The Bunny' points excitedly at distant islands. Warm lantern light, deep ocean blues. Classic pin-up comic style. Captain Chas is seen from behind. Epic dawn lighting, scanning the horizon.",
    fifthGraderBriefing: "We are going to check out the land and see what kind of computers we have available before we start building.",
    fifthGraderSummary: "We looked around and found the computers we need! We also wrote down our findings so we don't forget them."
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
    ],
    videoPrompt: "Cinematic retro 1985 pirate fantasy art: The crew descends into a glowing underground cavern. Liv places glowing crystals into three ancient vaults. The Bunny guards the entrance with a cheeky grin. Masterful glowing gold and emerald tones, female-led pirate crew.",
    fifthGraderBriefing: "We are making some safe treasure chests (folders) on our computer so we have a super safe place to keep all our maps and instructions.",
    fifthGraderSummary: "Yay! The treasure chests are built and locked up tight. We can officially start putting our important files inside."
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
    ],
    videoPrompt: "Cinematic retro 1985 pirate fantasy art: Dramatic night scene on the ship. A massive ship's wheel pulses with ember light. A fierce cyber-parrot lands dramatically on the glowing wheel while Liv and The Bunny watch with pride and awe. The emotional peak of a captain's story.",
    fifthGraderBriefing: "Now we are going to wake up the super smart cyber-parrot so it can start flying the ship for us!",
    fifthGraderSummary: "The parrot is awake and in control! It knows how to use our treasure chests and is following all the rules."
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
    ],
    videoPrompt: "Cinematic retro 1985 pirate fantasy art: Inside a secure hold, Liv and The Bunny methodically lock chests and test heavy chains. Powerful steel and silver tones, beautiful retro comic female crew taking charge of a pirate ship.",
    fifthGraderBriefing: "We are installing private helpers on our own computers so we don't have to send any secrets over the internet.",
    fifthGraderSummary: "The private helpers are ready! They are locked safely inside our ship and won't talk to strangers."
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
    ],
    videoPrompt: "Cinematic retro 1985 pirate fantasy art: A beautiful glowing library inside the ship. Liv carefully places glowing scrolls into an ancient memory archive while The Bunny falls asleep on a pile of scrolls. Atmospheric deep purple light and warm lantern glow.",
    fifthGraderBriefing: "We are building a magic diary so our parrot and helpers can remember everything we do together.",
    fifthGraderSummary: "The magic diary is working! Now our crew will always remember our past adventures."
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
    ],
    videoPrompt: "Cinematic retro 1985 pirate fantasy art: Epic montage in a glowing shipyard. Female pirates including Liv build and upgrade the ship using glowing blueprints. The Bunny is hammering with oversized goggles. Orange-bronze industrial tones, flying sparks.",
    fifthGraderBriefing: "We are going to use some special blueprints to automatically build the rest of our computers exactly how we want them.",
    fifthGraderSummary: "The blueprints worked! All of our computers are set up perfectly and are ready for action."
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
    ],
    videoPrompt: "Cinematic retro 1985 pirate fantasy art: Triumphant finale. High in the crow's nest at sunset, Liv and The Bunny stand together looking at the horizon as the full upgraded ship sails into golden light. Captain Chas's reflection. Victory, celebration, gorgeous glowing clouds.",
    fifthGraderBriefing: "This is the final check! We are making sure everyone can talk to each other and everything is working perfectly.",
    fifthGraderSummary: "We did it! The ship is fully upgraded and everyone is working together. Time to celebrate!"
  }
];

export const INITIAL_LOG = `Captain's Log: Stardate 2026.05
We have begun the voyage to claim the Grok Sovereign Swarm.
The charts are old, but Grok's cyber- parrot brain is sharp.
Liv and the Bunny are ready. We sail at dawn!`;
