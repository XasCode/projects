provider "archive" {}

data "archive_file" "srcfiles" {
  type        = "zip"
  output_path = "projects.zip"
  source_dir  = "./src"
}
