resource "google_storage_bucket" "bucket" {
  count         = contains(var.envs, var.environment) ? 1 : 0
  project       = module.projects.id
  name          = "projects-bucket-${random_id.random[0].hex}"
  location      = local.region
  force_destroy = true
}

resource "google_storage_bucket" "project_records" {
  count         = contains(var.envs, var.environment) ? 1 : 0
  project       = module.projects.id
  name          = "project_records_${module.projects.id}"
  location      = local.region
  force_destroy = true
}

resource "google_storage_bucket_object" "archive" {
  count  = contains(var.envs, var.environment) ? 1 : 0
  name   = "index-${filemd5(data.archive_file.srcfiles[0].output_path)}.zip"
  bucket = google_storage_bucket.bucket[0].name
  source = data.archive_file.srcfiles[0].output_path
}
