{
  pkgs ? import <nixpkgs> { },
}:

with pkgs;
pkgs.mkShell {
  name = "revoltEnv";

  buildInputs = [
    # Tools
    git
    gh
    deno

    # Node
    nodejs
    nodejs.pkgs.pnpm

    # mdbook
    mdbook
    mdbook-mermaid
  ];

  shellHook = ''
    export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
    export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true

    playwrightNpmVersion="$(npm show @playwright/test version)"
    echo "❄️  Playwright nix version: ${pkgs.playwright.version}"
    echo "📦 Playwright npm version: $playwrightNpmVersion"

    if [ "${pkgs.playwright.version}" != "$playwrightNpmVersion" ]; then
      echo "❌ Playwright versions in nix and npm are not the same!"
    else
      echo "✅ Playwright versions in nix and npm are the same"
    fi
  '';
}
