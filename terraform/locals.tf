data "terraform_remote_state" "terraform-devl" {
  backend = "remote"
  config = {
    organization = "xascode"
    workspaces = {
      name = "terraform-devl"
    }
  }
}

locals {
  project = {
          "id": "projects-ed4276",
          "name": "projects",
          "number": "869543001932",
          "path": "dev/xascode/devl/corp/projects"
        }
  // [for x in data.terraform_remote_state.terraform-devl.outputs.projects: x if x.path == var.project_path][0]
  parent = {
          "name": "folders/173195572346",
          "path": "dev/xascode/devl/corp/"
        }
  //for x in data.terraform_remote_state.terraform-devl.outputs.folders: x if x.path == "${join("/", slice(split("/", var.project_path), 0, length(split("/", var.project_path))-1))}/"][0]
}
