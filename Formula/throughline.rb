class Throughline < Formula
  desc "The dev-native way to make decks"
  homepage "https://github.com/michael-goller/throughline"
  url "https://github.com/michael-goller/throughline.git", branch: "main"
  version "0.2.0"
  license "MIT"

  depends_on "node@20"

  def install
    # Install CLI dependencies and build
    cd "cli" do
      system "npm", "install", "--no-audit", "--no-fund"
      system "npm", "run", "build"
    end

    # Install template dependencies
    cd "template" do
      system "npm", "install", "--no-audit", "--no-fund", "--production"
    end

    # Copy everything to libexec
    libexec.install Dir["*"]

    # Create wrapper script that sets up the right paths
    (bin/"throughline").write <<~EOS
      #!/usr/bin/env bash
      exec "#{Formula["node@20"].opt_bin}/node" "#{libexec}/cli/bin/throughline.js" "$@"
    EOS
  end

  def post_install
    # Create default config if not present
    throughline_dir = "#{ENV["HOME"]}/.throughline"
    config_file = "#{throughline_dir}/config.json"
    return if File.exist?(config_file)

    mkdir_p throughline_dir
    File.write(config_file, JSON.generate({
      "template_path" => "#{libexec}/template",
      "decks_path" => "#{ENV["HOME"]}/decks",
      "port_range" => [5173, 5199]
    }))
  end

  test do
    assert_match "The dev-native way to make decks", shell_output("#{bin}/throughline --help")
  end
end
