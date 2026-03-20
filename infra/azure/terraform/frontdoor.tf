locals {
  backend_fqdn = jsondecode(azapi_resource.backend_app.output).properties.configuration.ingress.fqdn
}

resource "azurerm_cdn_frontdoor_profile" "backend" {
  count               = var.enable_front_door ? 1 : 0
  name                = "${local.name_prefix}-fd"
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "Standard_AzureFrontDoor"
  tags                = local.common_tags
}

resource "azurerm_cdn_frontdoor_endpoint" "backend" {
  count                    = var.enable_front_door ? 1 : 0
  name                     = "${local.name_prefix}-fd-endpoint"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.backend[0].id
  tags                     = local.common_tags
}

resource "azurerm_cdn_frontdoor_origin_group" "backend" {
  count                    = var.enable_front_door ? 1 : 0
  name                     = "${local.name_prefix}-fd-og"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.backend[0].id

  load_balancing {
    sample_size                        = 4
    successful_samples_required        = 3
    additional_latency_in_milliseconds = 0
  }

  health_probe {
    interval_in_seconds = 60
    path                = "/actuator/health/readiness"
    protocol            = "Https"
    request_type        = "GET"
  }
}

resource "azurerm_cdn_frontdoor_origin" "backend" {
  count                         = var.enable_front_door ? 1 : 0
  name                          = "${local.name_prefix}-fd-origin"
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.backend[0].id
  enabled                       = true
  host_name                     = local.backend_fqdn
  http_port                     = 80
  https_port                    = 443
  origin_host_header            = local.backend_fqdn
  priority                      = 1
  weight                        = 1000
  certificate_name_check_enabled = true
}

resource "azurerm_cdn_frontdoor_firewall_policy" "backend" {
  count               = var.enable_front_door ? 1 : 0
  name                = "${local.name_prefix}-fd-waf"
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "Standard_AzureFrontDoor"
  enabled             = true
  mode                = "Prevention"

  custom_rule {
    name                           = "RateLimitPerIp"
    enabled                        = true
    priority                       = 1
    type                           = "RateLimitRule"
    action                         = "Block"
    rate_limit_duration_in_minutes = 1
    rate_limit_threshold           = var.frontdoor_rate_limit_threshold

    match_condition {
      match_variable   = "RemoteAddr"
      operator         = "IPMatch"
      negation_condition = false
      match_values     = ["0.0.0.0/0"]
    }
  }
}

resource "azurerm_cdn_frontdoor_route" "backend" {
  count                         = var.enable_front_door ? 1 : 0
  name                          = "${local.name_prefix}-fd-route"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.backend[0].id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.backend[0].id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.backend[0].id]
  supported_protocols           = ["Http", "Https"]
  patterns_to_match             = ["/*"]
  forwarding_protocol           = "HttpsOnly"
  https_redirect_enabled        = true
  link_to_default_domain        = true
  enabled                       = true
}

resource "azurerm_cdn_frontdoor_security_policy" "backend" {
  count                    = var.enable_front_door ? 1 : 0
  name                     = "${local.name_prefix}-fd-security"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.backend[0].id

  security_policies {
    firewall {
      cdn_frontdoor_firewall_policy_id = azurerm_cdn_frontdoor_firewall_policy.backend[0].id

      association {
        domain {
          cdn_frontdoor_domain_id = azurerm_cdn_frontdoor_endpoint.backend[0].id
        }
        patterns_to_match = ["/*"]
      }
    }
  }
}
