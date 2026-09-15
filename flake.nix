{
  description = "Stoat for-web development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    # avoids us having to hardcode system (eg. x86_64) for flakes
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
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
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            mise
            cargo-binstall
            playwright-test
          ];

          shellHook = ''
            export NIX_LD="${pkgs.stdenv.cc.libc}/lib/ld-linux-x86-64.so.2"
            export NIX_LD_LIBRARY_PATH="${nix-ld-libs}/lib"

            export MISE_NODE_COMPILE=false
            eval "$(mise activate bash)"

            export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
            export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true

            if ! command -v npm &> /dev/null; then
              echo "⚠️  'npm' is missing from your environment."
              echo "👉 Run 'mise install' to install Node.js and other project dependencies."
            else
              playwrightNpmVersion="$(npm show @playwright/test version 2>/dev/null)"
              echo "❄️  Playwright nix version: ${pkgs.playwright.version}"
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
}
