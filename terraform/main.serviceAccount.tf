resource "google_organization_iam_custom_role" "role-svc-check-projects" {
  role_id     = "role_svc_check_projects_${random_id.random.hex}"
  org_id      = var.organization_id
  title       = "role_svc_check_projects_${random_id.random.hex}"
  description = "Role / permissions to assign to service account for automatically checking projects."
  permissions = [
    #"compute.disks.list",
    "compute.projects.get",
    #"compute.snapshots.list",
    #"compute.instances.list",
    #"compute.regions.list",
    #"compute.zones.list",
    #"compute.disks.addResourcePolicies",
    #"compute.resourcePolicies.create",
    #"compute.resourcePolicies.get",
    #"compute.resourcePolicies.list",
    #"compute.resourcePolicies.use",
    "resourcemanager.organizations.get",
    "resourcemanager.folders.get",
    "resourcemanager.folders.list",
    "resourcemanager.projects.get",
    "resourcemanager.projects.list",
    "secretmanager.versions.access",
#    "secretmanager.locations.get",
#    "secretmanager.locations.list",
#    "secretmanager.secrets.get",
#    "secretmanager.secrets.getIamPolicy",
#    "secretmanager.secrets.list",
#    "secretmanager.versions.get",
#    "secretmanager.versions.list",
    "storage.objects.create"
  ]
}

resource "google_service_account" "svc-check-projects" {
  account_id   = "svc-check-projects-${random_id.random.hex}"
  display_name = "Service account for checking management of projects"
  project      = local.project.id
}
