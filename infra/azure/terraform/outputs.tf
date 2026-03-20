output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_name" {
  value = azurerm_container_registry.main.name
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "container_app_name" {
  value = local.container_app_name
}

output "container_app_fqdn" {
  value = jsondecode(azapi_resource.backend_app.output).properties.configuration.ingress.fqdn
}

output "backend_public_url" {
  value = var.enable_front_door ? "https://${azurerm_cdn_frontdoor_endpoint.backend[0].host_name}" : "https://${jsondecode(azapi_resource.backend_app.output).properties.configuration.ingress.fqdn}"
}

output "static_web_app_default_host_name" {
  value = azurerm_static_web_app.frontend.default_host_name
}

output "key_vault_name" {
  value = azurerm_key_vault.main.name
}

output "application_insights_name" {
  value = azurerm_application_insights.main.name
}

output "postgres_server_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}
