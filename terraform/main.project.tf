module "projects" {
  source = "./vendor/modules/project"
  
  name   = "projects"
  parent = var.parent

  billing_account = var.billing_account

  envs   = var.envs
  environment    = var.environment
}
