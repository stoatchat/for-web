{ pkgs ? import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/64c08a7ca051951c8eae34e3e3cb1e202fe36786.tar.gz";
    sha256 = "16mzn8kd1x08cgl13csgfmix41qbx2q1g3acpby0cwg92drq375n";
  }) {},

  # Playwright v1.57.0
  unstablePkgs ? import (fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/145b67bd0bd4e075f981c1c2b81155d9e2982de2.tar.gz";
    sha256 = "152qwxacs6lw1dskn21985qly8ipjzwpsvicy7inzh3hhma603gg";
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
      exec ${pkgs.fish}/bin/fish -C '${pkgs.mise}/bin/mise activate fish | source' "$@"
    '')
  ];

  shellHook = ''
    export NIX_LD="${pkgs.stdenv.cc.libc}/lib/ld-linux-x86-64.so.2"
    export NIX_LD_LIBRARY_PATH="${nix-ld-libs}/lib"

    export MISE_NODE_COMPILE=false
    eval "$(${pkgs.mise}/bin/mise activate bash)"

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