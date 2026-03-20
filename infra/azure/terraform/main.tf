data "azurerm_client_config" "current" {}

resource "random_string" "suffix" {
  length  = 5
  upper   = false
  special = false
}

resource "random_password" "postgres_admin_password" {
  length           = 32
  special          = true
  override_special = "!@#$%^&*()-_=+[]{}"
}

resource "random_password" "jwt_secret" {
  length           = 64
  special          = true
  override_special = "!@#$%^&*()-_=+[]{}"
}

locals {
  name_prefix             = lower("${var.project_name}-${var.environment_name}")
  resource_group_name     = "${local.name_prefix}-rg"
  log_analytics_name      = "${local.name_prefix}-law"
  app_insights_name       = "${local.name_prefix}-appi"
  container_env_name      = "${local.name_prefix}-cae"
  container_app_name      = "${local.name_prefix}-api"
  postgres_server_name    = substr("${replace(local.name_prefix, "-", "")}pg${random_string.suffix.result}", 0, 63)
  postgres_database_name  = "personal_finance_tracker"
  postgres_admin_username = "pfadmin"
  acr_name                = substr("${replace(var.project_name, "-", "")}${var.environment_name}${random_string.suffix.result}", 0, 50)
  key_vault_name          = substr("${local.name_prefix}-kv-${random_string.suffix.result}", 0, 24)
  static_web_app_name     = "${local.name_prefix}-swa"
  user_assigned_identity  = "${local.name_prefix}-backend-mi"
  common_tags             = merge(var.tags, { environment = var.environment_name })
}

resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.common_tags
}

resource "azurerm_log_analytics_workspace" "main" {
  name                = local.log_analytics_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}

resource "azurerm_application_insights" "main" {
  name                = local.app_insights_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"
  tags                = local.common_tags
}

resource "azurerm_container_registry" "main" {
  name                          = local.acr_name
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  sku                           = "Premium"
  admin_enabled                 = false
  public_network_access_enabled = true
  zone_redundancy_enabled       = true
  tags                          = local.common_tags
}

resource "azurerm_user_assigned_identity" "backend" {
  name                = local.user_assigned_identity
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

resource "azurerm_key_vault" "main" {
  name                       = local.key_vault_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  purge_protection_enabled   = true
  soft_delete_retention_days = 90
  enable_rbac_authorization  = false
  tags                       = local.common_tags
}

resource "azurerm_key_vault_access_policy" "terraform" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = data.azurerm_client_config.current.object_id

  secret_permissions = ["Get", "List", "Set", "Delete", "Recover", "Backup", "Restore", "Purge"]
}

resource "azurerm_key_vault_access_policy" "backend_identity" {
  key_vault_id = azurerm_key_vault.main.id
  tenant_id    = data.azurerm_client_config.current.tenant_id
  object_id    = azurerm_user_assigned_identity.backend.principal_id

  secret_permissions = ["Get", "List"]
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = random_password.jwt_secret.result
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_postgresql_flexible_server" "main" {
  name                          = local.postgres_server_name
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = var.postgres_version
  delegated_subnet_id           = null
  private_dns_zone_id           = null
  public_network_access_enabled = true
  administrator_login           = local.postgres_admin_username
  administrator_password        = random_password.postgres_admin_password.result
  storage_mb                    = var.postgres_storage_mb
  sku_name                      = var.postgres_sku_name
  backup_retention_days         = var.postgres_backup_retention_days
  geo_redundant_backup_enabled  = var.postgres_geo_redundant_backup_enabled
  zone                          = "1"
  tags                          = local.common_tags
}

resource "azurerm_postgresql_flexible_server_database" "main" {
  name      = local.postgres_database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  count             = var.allow_azure_services_to_postgres ? 1 : 0
  name              = "allow-azure-services"
  server_id         = azurerm_postgresql_flexible_server.main.id
  start_ip_address  = "0.0.0.0"
  end_ip_address    = "0.0.0.0"
}

resource "azurerm_key_vault_secret" "db_url" {
  name         = "spring-datasource-url"
  value        = "jdbc:postgresql://${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.main.name}?sslmode=require"
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_key_vault_secret" "db_username" {
  name         = "spring-datasource-username"
  value        = azurerm_postgresql_flexible_server.main.administrator_login
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "spring-datasource-password"
  value        = random_password.postgres_admin_password.result
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_key_vault_secret" "appinsights_connection_string" {
  name         = "applicationinsights-connection-string"
  value        = azurerm_application_insights.main.connection_string
  key_vault_id = azurerm_key_vault.main.id
  depends_on   = [azurerm_key_vault_access_policy.terraform]
}

resource "azurerm_static_web_app" "frontend" {
  name                = local.static_web_app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = "eastus2"
  sku_tier            = var.frontend_sku_tier
  sku_size            = var.frontend_sku_tier
  tags                = local.common_tags
}

resource "azurerm_container_app_environment" "main" {
  name                       = local.container_env_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = local.common_tags
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.backend.principal_id
}

resource "azapi_resource" "backend_app" {
  type      = "Microsoft.App/containerApps@2025-01-01"
  name      = local.container_app_name
  parent_id = azurerm_resource_group.main.id
  location  = azurerm_resource_group.main.location
  tags      = local.common_tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.backend.id]
  }

  schema_validation_enabled = false
  response_export_values = [
    "properties.configuration.ingress.fqdn",
    "properties.latestRevisionName"
  ]

  body = {
    properties = {
      managedEnvironmentId = azurerm_container_app_environment.main.id
      configuration = {
        activeRevisionsMode = "Multiple"
        ingress = {
          allowInsecure = false
          external      = true
          targetPort    = 8080
          transport     = "auto"
          traffic = [
            {
              latestRevision = true
              weight         = 100
            }
          ]
        }
        registries = [
          {
            server   = azurerm_container_registry.main.login_server
            identity = azurerm_user_assigned_identity.backend.id
          }
        ]
        secrets = [
          {
            name        = "spring-datasource-url"
            keyVaultUrl = azurerm_key_vault_secret.db_url.versionless_id
            identity    = azurerm_user_assigned_identity.backend.id
          },
          {
            name        = "spring-datasource-username"
            keyVaultUrl = azurerm_key_vault_secret.db_username.versionless_id
            identity    = azurerm_user_assigned_identity.backend.id
          },
          {
            name        = "spring-datasource-password"
            keyVaultUrl = azurerm_key_vault_secret.db_password.versionless_id
            identity    = azurerm_user_assigned_identity.backend.id
          },
          {
            name        = "jwt-secret"
            keyVaultUrl = azurerm_key_vault_secret.jwt_secret.versionless_id
            identity    = azurerm_user_assigned_identity.backend.id
          },
          {
            name        = "applicationinsights-connection-string"
            keyVaultUrl = azurerm_key_vault_secret.appinsights_connection_string.versionless_id
            identity    = azurerm_user_assigned_identity.backend.id
          }
        ]
      }
      template = {
        revisionSuffix = "initial"
        containers = [
          {
            name  = "backend"
            image = "${azurerm_container_registry.main.login_server}/${var.backend_image_repository}:${var.initial_image_tag}"
            resources = {
              cpu    = var.container_app_cpu
              memory = var.container_app_memory
            }
            env = [
              {
                name  = "SPRING_PROFILES_ACTIVE"
                value = var.environment_name
              },
              {
                name      = "SPRING_DATASOURCE_URL"
                secretRef = "spring-datasource-url"
              },
              {
                name      = "SPRING_DATASOURCE_USERNAME"
                secretRef = "spring-datasource-username"
              },
              {
                name      = "SPRING_DATASOURCE_PASSWORD"
                secretRef = "spring-datasource-password"
              },
              {
                name      = "JWT_SECRET"
                secretRef = "jwt-secret"
              },
              {
                name      = "APPLICATIONINSIGHTS_CONNECTION_STRING"
                secretRef = "applicationinsights-connection-string"
              },
              {
                name  = "APP_FRONTEND_URL"
                value = "https://${azurerm_static_web_app.frontend.default_host_name}"
              },
              {
                name  = "APP_SECURITY_LOG_PASSWORD_RESET_TOKENS"
                value = "false"
              },
              {
                name  = "SPRINGDOC_SWAGGER_UI_ENABLED"
                value = tostring(var.springdoc_enabled)
              },
              {
                name  = "SPRINGDOC_API_DOCS_ENABLED"
                value = tostring(var.springdoc_enabled)
              },
              {
                name  = "MANAGEMENT_TRACING_SAMPLING_PROBABILITY"
                value = "1.0"
              }
            ]
            probes = [
              {
                type = "Liveness"
                httpGet = {
                  path = "/actuator/health/liveness"
                  port = 8080
                }
                initialDelaySeconds = 40
                periodSeconds       = 30
                timeoutSeconds      = 5
                failureThreshold    = 3
              },
              {
                type = "Readiness"
                httpGet = {
                  path = "/actuator/health/readiness"
                  port = 8080
                }
                initialDelaySeconds = 20
                periodSeconds       = 15
                timeoutSeconds      = 5
                failureThreshold    = 3
              },
              {
                type = "Startup"
                httpGet = {
                  path = "/actuator/health"
                  port = 8080
                }
                initialDelaySeconds = 10
                periodSeconds       = 10
                timeoutSeconds      = 5
                failureThreshold    = 12
              }
            ]
          }
        ]
        scale = {
          minReplicas = var.container_app_min_replicas
          maxReplicas = var.container_app_max_replicas
          rules = [
            {
              name = "http-concurrency"
              http = {
                metadata = {
                  concurrentRequests = tostring(var.container_app_http_concurrency)
                }
              }
            },
            {
              name = "cpu-utilization"
              custom = {
                type = "cpu"
                metadata = {
                  type  = "Utilization"
                  value = "70"
                }
              }
            },
            {
              name = "memory-utilization"
              custom = {
                type = "memory"
                metadata = {
                  type  = "Utilization"
                  value = "80"
                }
              }
            }
          ]
        }
      }
    }
  }

  depends_on = [
    azurerm_key_vault_access_policy.backend_identity,
    azurerm_role_assignment.acr_pull
  ]
}

resource "azurerm_monitor_diagnostic_setting" "acr" {
  name                       = "${local.name_prefix}-acr-diag"
  target_resource_id         = azurerm_container_registry.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "ContainerRegistryRepositoryEvents"
  }

  enabled_log {
    category = "ContainerRegistryLoginEvents"
  }

  metric {
    category = "AllMetrics"
  }
}

resource "azurerm_monitor_diagnostic_setting" "key_vault" {
  name                       = "${local.name_prefix}-kv-diag"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AuditEvent"
  }

  metric {
    category = "AllMetrics"
  }
}

resource "azurerm_monitor_diagnostic_setting" "postgres" {
  name                       = "${local.name_prefix}-pg-diag"
  target_resource_id         = azurerm_postgresql_flexible_server.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "PostgreSQLLogs"
  }

  metric {
    category = "AllMetrics"
  }
}

resource "azurerm_monitor_diagnostic_setting" "container_environment" {
  name                       = "${local.name_prefix}-cae-diag"
  target_resource_id         = azurerm_container_app_environment.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "ContainerAppSystemLogs"
  }

  enabled_log {
    category = "ContainerAppConsoleLogs"
  }
}

resource "azurerm_monitor_action_group" "main" {
  count               = var.alert_email_address == "" ? 0 : 1
  name                = "${local.name_prefix}-alerts"
  short_name          = "pfalerts"
  resource_group_name = azurerm_resource_group.main.name

  email_receiver {
    name          = "primary"
    email_address = var.alert_email_address
  }
}

locals {
  alert_action_group_ids = var.alert_email_address == "" ? [] : [azurerm_monitor_action_group.main[0].id]
}

resource "azurerm_monitor_metric_alert" "cpu" {
  name                = "${local.name_prefix}-cpu-high"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azapi_resource.backend_app.id]
  description         = "Container App CPU usage is consistently high."
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  action {
    action_group_id = local.alert_action_group_ids[0]
  }
  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "UsageNanoCores"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 700000000
  }

  count = var.alert_email_address == "" ? 0 : 1
}

resource "azurerm_monitor_metric_alert" "memory" {
  name                = "${local.name_prefix}-memory-high"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azapi_resource.backend_app.id]
  description         = "Container App memory usage is consistently high."
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"
  action {
    action_group_id = local.alert_action_group_ids[0]
  }
  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "UsageBytes"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 1500000000
  }

  count = var.alert_email_address == "" ? 0 : 1
}

resource "azurerm_application_insights_standard_web_test" "health" {
  count                   = var.alert_email_address == "" ? 0 : 1
  name                    = "${local.name_prefix}-health"
  location                = azurerm_resource_group.main.location
  resource_group_name     = azurerm_resource_group.main.name
  application_insights_id = azurerm_application_insights.main.id
  geo_locations           = ["us-ca-sjc-azr", "us-fl-mia-edge"]
  frequency               = 300
  timeout                 = 30
  enabled                 = true
  kind                    = "ping"
  retry_enabled           = true

  request {
    url = var.enable_front_door ? "https://${azurerm_cdn_frontdoor_endpoint.backend[0].host_name}/actuator/health/readiness" : "https://${jsondecode(azapi_resource.backend_app.output).properties.configuration.ingress.fqdn}/actuator/health/readiness"
  }

  validation_rules {
    expected_status_code = 200
  }
}

resource "azurerm_monitor_metric_alert" "health" {
  count               = var.alert_email_address == "" ? 0 : 1
  name                = "${local.name_prefix}-health-failures"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Health check is failing."
  severity            = 1
  frequency           = "PT5M"
  window_size         = "PT5M"
  action {
    action_group_id = local.alert_action_group_ids[0]
  }
  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "failedLocationCount"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 0
  }
}
