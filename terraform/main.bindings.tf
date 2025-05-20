resource "google_project_iam_binding" "project" {
  count   = contains(var.envs, var.environment) ? 1 : 0
  project = module.projects.id
  role    = google_organization_iam_custom_role.role-svc-check-projects[0].name
  members = [
    "serviceAccount:${google_service_account.svc-check-projects[0].email}",
  ]
}

resource "google_secret_manager_secret_iam_binding" "binding" {
  count   = contains(var.envs, var.environment) ? 1 : 0
  project = module.projects.id
  secret_id = google_secret_manager_secret.secret-basic[0].id
  role = google_organization_iam_custom_role.role-svc-check-projects[0].name
  members = [
    "serviceAccount:${google_service_account.svc-check-projects[0].email}"
  ]
}

resource "google_storage_bucket_iam_binding" "binding" {
  count   = contains(var.envs, var.environment) ? 1 : 0
  bucket = google_storage_bucket.project_records[0].name
  role = google_organization_iam_custom_role.role-svc-check-projects[0].name
  members = [
    "serviceAccount:${google_service_account.svc-check-projects[0].email}"
  ]
}

resource "google_folder_iam_binding" "parent_folder" {
  count   = contains(var.envs, var.environment) ? 1 : 0
  folder  = var.parent.name
  role    = google_organization_iam_custom_role.role-svc-check-projects[0].name
  members = [
    "serviceAccount:${google_service_account.svc-check-projects[0].email}",
  ]
}
