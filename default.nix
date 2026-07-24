{ pkgs ? import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/110ffdee50af63b1f3adb714e0d5cc679999e108.tar.gz";
    sha256 = "1x2z0wx0mph8l29fjchl8hdnsqvklv8md28qdijg6lscdr8x3n9n";
  }) {},

  # Playwright v1.60.0
  unstablePkgs ? import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/9e87430ac7e25a6ba9f5a593c300f4e114a00f57.tar.gz";
    sha256 = "1zcfwvx89r4w2qgnlq1fqvp6zpzzq4xlc786z6i37454nj0s87rj";
  }) {},
}:

let
  nix-ld-libs = pkgs.buildEnv {
    name = "nix-ld-libs";
    paths = with pkgs; [
      stdenv.cc.cc.lib
      zlib
      openssl
    ];
  };

in pkgs.mkShell {
  packages = with pkgs; [
    mise
    cargo-binstall
    (writeShellScriptBin "fish" ''
      exec ${pkgs.fish}/bin/fish -C 'mise activate fish | source' "$@"
    '')
  ];

  shellHook = ''
    export NIX_LD="${pkgs.stdenv.cc.libc}/lib/ld-linux-x86-64.so.2"
    export NIX_LD_LIBRARY_PATH="${nix-ld-libs}/lib"

    export MISE_NODE_COMPILE=false
    eval "$(mise activate bash)"

    export PLAYWRIGHT_BROWSERS_PATH=${unstablePkgs.playwright-driver.browsers}
    export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true

    playwrightNpmVersion="$(npm show @playwright/test version)"
    echo "❄️  Playwright nix version: ${unstablePkgs.playwright.version}"
    echo "📦 Playwright npm version: $playwrightNpmVersion"

    if [ "${unstablePkgs.playwright.version}" != "$playwrightNpmVersion" ]; then
      echo "❌ Playwright versions in nix and npm are not the same!"
    else
      echo "✅ Playwright versions in nix and npm are the same"
    fi
  '';
}
