class Shine < Formula
  desc "Beautiful slide decks made simple"
  homepage "https://github.com/michael-goller/shine"
  url "https://github.com/michael-goller/shine.git", branch: "main"
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
    (bin/"shine").write <<~EOS
      #!/usr/bin/env bash
      exec "#{Formula["node@20"].opt_bin}/node" "#{libexec}/cli/bin/shine.js" "$@"
    EOS
  end

  def post_install
    # Create default config if not present
    shine_dir = "#{ENV["HOME"]}/.shine"
    config_file = "#{shine_dir}/config.json"
    return if File.exist?(config_file)

    mkdir_p shine_dir
    File.write(config_file, JSON.generate({
      "template_path" => "#{libexec}/template",
      "decks_path" => "#{ENV["HOME"]}/decks",
      "port_range" => [5173, 5199]
    }))
  end

  test do
    assert_match "Beautiful slide decks made simple", shell_output("#{bin}/shine --help")
  end
end
