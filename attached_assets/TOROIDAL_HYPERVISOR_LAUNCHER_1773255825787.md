# Toroidal Hypervisor Launcher

## What this adds

A Windows-first launcher for the local hypervisor flow:

- tray icon
- double-click launcher
- optional Windows startup registration
- starts both:
  - `ChameleonBrowser/chameleon.py`
  - `python -m context_engine serve http 8765`

## Fastest way to use it

Double-click:

- [Launch_Toroidal_Hypervisor.cmd](Launch_Toroidal_Hypervisor.cmd)

That starts the tray app with no terminal gymnastics.

## Tray menu

The tray app supports:

- Start Hypervisor
- Open Chameleon
- Start Context Server
- Open HANDOFFS Folder
- Open Workspace
- Enable Startup
- Disable Startup
- Stop Chameleon
- Stop Context Server
- Stop All
- Exit

## Startup behavior

If you click `Enable Startup`, the launcher writes a command file into the current user's Windows Startup folder.

That means after login it can come up automatically without opening VS Code first.

## Build an EXE

Double-click:

- [build_toroidal_hypervisor_exe.cmd](build_toroidal_hypervisor_exe.cmd)

If the build succeeds, the EXE will be placed at:

- [dist/ToroidalHypervisor.exe](dist/ToroidalHypervisor.exe)

## Security note

This launcher keeps the local services bound to `localhost`, which is a good baseline because it reduces exposure on the local network.

It does **not** add a VPN or end-to-end transport layer by itself.

For outbound traffic protection, the next sensible layer would be one of:

- WireGuard / Tailscale
- Cloudflare WARP
- trusted VPN client
- HTTPS-only provider routing
- later, end-to-end envelope encryption for the mail side

So this launcher solves **operational startup and control**, not network anonymity by itself.
