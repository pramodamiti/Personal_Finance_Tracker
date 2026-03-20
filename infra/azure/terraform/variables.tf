variable "subscription_id" {
  type        = string
  description = "Azure subscription ID."
}

variable "location" {
  type        = string
  description = "Azure region."
  default     = "eastus2"
}

variable "project_name" {
  type        = string
  description = "Project short name used in resource naming."
  default     = "personalfin"
}

variable "environment_name" {
  type        = string
  description = "Deployment environment name."
}

variable "tags" {
  type        = map(string)
  description = "Common Azure tags."
  default = {
    managed-by = "terraform"
    workload   = "personal-finance-tracker"
  }
}

variable "backend_image_repository" {
  type        = string
  description = "ACR repository name for the backend image."
}

variable "initial_image_tag" {
  type        = string
  description = "Container image tag deployed during the first Terraform apply."
  default     = "latest"
}

variable "container_app_cpu" {
  type        = number
  description = "CPU requested by the backend container."
  default     = 1
}

variable "container_app_memory" {
  type        = string
  description = "Memory requested by the backend container."
  default     = "2Gi"
}

variable "container_app_min_replicas" {
  type        = number
  description = "Minimum backend replicas."
  default     = 2
}

variable "container_app_max_replicas" {
  type        = number
  description = "Maximum backend replicas."
  default     = 10
}

variable "container_app_http_concurrency" {
  type        = number
  description = "Concurrent request threshold for HTTP autoscaling."
  default     = 100
}

variable "postgres_sku_name" {
  type        = string
  description = "PostgreSQL Flexible Server SKU."
  default     = "GP_Standard_D2ds_v4"
}

variable "postgres_storage_mb" {
  type        = number
  description = "PostgreSQL storage in MB."
  default     = 65536
}

variable "postgres_version" {
  type        = string
  description = "PostgreSQL major version."
  default     = "16"
}

variable "postgres_backup_retention_days" {
  type        = number
  description = "PostgreSQL backup retention period."
  default     = 14
}

variable "postgres_geo_redundant_backup_enabled" {
  type        = bool
  description = "Whether geo-redundant backup is enabled."
  default     = true
}

variable "allow_azure_services_to_postgres" {
  type        = bool
  description = "Allow Azure services to reach PostgreSQL through firewall rule 0.0.0.0."
  default     = true
}

variable "springdoc_enabled" {
  type        = bool
  description = "Expose Swagger/OpenAPI endpoints."
  default     = false
}

variable "frontend_sku_tier" {
  type        = string
  description = "Static Web App SKU tier."
  default     = "Standard"
}

variable "enable_front_door" {
  type        = bool
  description = "Enable Azure Front Door with WAF rate limiting in front of the backend."
  default     = true
}

variable "frontdoor_rate_limit_threshold" {
  type        = number
  description = "Requests per minute per client IP before Front Door blocks traffic."
  default     = 3000
}

variable "alert_email_address" {
  type        = string
  description = "Optional email address to receive platform alerts."
  default     = ""
}
