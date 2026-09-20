{
  description = "Stoat for-web development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    # Pin 'playwright' as package.json in packages/client expects it
    # Always update this when package.json updates playwright version
    nixpkgs-playwright-1_60_0.url = "github:NixOS/nixpkgs/33f539df43ae63a09cb69baec738fb43f073e5b4";
  };

  outputs =
    { self, nixpkgs, nixpkgs-playwright-1_60_0 }:
    let
      # Supported system map
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      # Generate attrs for each supported system
      forEachSystem = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      devShells = forEachSystem (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
          };

          playwrightPkgs = import nixpkgs-playwright-1_60_0 {
            inherit system;
          };

          nix-ld-libs = pkgs.buildEnv {
            name = "nix-ld-libs";
            paths = with pkgs; [
              stdenv.cc.cc.lib
              zlib
              openssl
            ];
          };
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              mise
              cargo-binstall
              playwrightPkgs.playwright-test
            ];

            shellHook = ''
              export NIX_LD="${pkgs.stdenv.cc.libc}/lib/ld-linux-x86-64.so.2"
              export NIX_LD_LIBRARY_PATH="${nix-ld-libs}/lib"

              export MISE_NODE_COMPILE=false
              eval "$(mise activate bash)"

              export PLAYWRIGHT_BROWSERS_PATH=${playwrightPkgs.playwright-driver.browsers}
              export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
              export PLAYWRIGHT_SKIP_BROWSER_GC=1

              if ! command -v npm &> /dev/null; then
                echo "⚠️  'npm' is missing from your environment."
                echo "👉 Run 'mise install' to install Node.js and other project dependencies."
              else
                playwrightNpmVersion="$(npm show @playwright/test version 2>/dev/null)"
                echo "❄️  Playwright nix version: ${playwrightPkgs.playwright.version}"
                echo "📦 Playwright npm version: $playwrightNpmVersion"

                if [ "${pkgs.playwright.version}" != "$playwrightNpmVersion" ]; then
                  echo "❌ Playwright versions in nix and npm are not the same!"
                  else
                  echo "✅ Playwright versions in nix and npm are the same"
                fi
              fi
            '';
          };
        }
      );
    };
}
