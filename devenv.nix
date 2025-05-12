{
  pkgs,
  ...
}:

{
  env.GREET = "CompuRiddle";

  # system packages
  packages = with pkgs; [
    git
    nodejs # node & npm
    libtensorflow # provides libtensorflow.so for tfjs-node
  ];

  scripts.setup.exec = ''
    npm ci
  '';

  # what runs each time you enter the shell
  enterShell = ''
    # make sure the native lib is on your loader path
    export LD_LIBRARY_PATH=${pkgs.libtensorflow}/lib:$LD_LIBRARY_PATH
  '';
}
