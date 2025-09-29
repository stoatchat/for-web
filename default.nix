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
}
