{
  pkgs ? import <nixpkgs> { },
}: pkgs.mkShell {
  name = "stoatEnv";

  buildInputs = with pkgs; [
    # Tools
    git
    gh
    deno

    # Node
    nodejs
    pnpm_10
  ];
}
