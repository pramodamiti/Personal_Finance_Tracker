# Azure SaaS Deployment Guide

## Directory structure

```text
.
├── .github/
│   └── workflows/
│       ├── backend-cicd.yml
│       └── frontend-cicd.yml
├── backend/
│   ├── Containerfile
│   └── src/
│       └── main/
│           ├── java/com/personalfinancetracker/app/config/
│           │   ├── AppProperties.java
│           │   ├── CorrelationIdFilter.java
│           │   ├── ObservabilityConfig.java
│           │   ├── SchedulingConfig.java
│           │   └── ShedLockConfig.java
│           └── resources/
│               ├── application.yml
│               ├── logback-spring.xml
│               └── db/migration/V2__shedlock.sql
├── docs/
│   └── azure-production.md
└── infra/
    └── azure/
        └── terraform/
            ├── backend.hcl.example
            ├── frontdoor.tf
            ├── main.tf
            ├── outputs.tf
            ├── production.tfvars.example
            ├── staging.tfvars.example
            ├── variables.tf
            └── versions.tf
```

## Architecture summary

- Backend runs on Azure Container Apps with multiple revisions enabled for zero-downtime rollouts.
- Frontend runs on Azure Static Web Apps and talks to the backend through an environment-specific API base URL.
- PostgreSQL runs on Azure Database for PostgreSQL Flexible Server.
- Secrets are generated into Azure Key Vault and referenced from Container Apps through a user-assigned managed identity.
- Logs flow to stdout in JSON for Azure Monitor and Log Analytics ingestion.
- Application Insights is enabled via runtime attach when `APPLICATIONINSIGHTS_CONNECTION_STRING` is present.
- Front Door is enabled by default in Terraform and applies WAF rate limiting in front of the backend. Bucket4j remains the in-app protection layer.

## Spring Boot production changes

### Multi-instance-safe recurring jobs

- `ShedLockConfig` enables JDBC-based distributed locking using PostgreSQL time.
- `RecurringTransactionScheduler` now uses `@SchedulerLock`.
- `V2__shedlock.sql` creates the shared lock table.

This prevents multiple replicas from running the same scheduled job concurrently.

### Structured logging and tracing

- `logback-spring.xml` emits one-line JSON logs.
- `CorrelationIdFilter` accepts or generates `X-Correlation-Id`, adds it to MDC, and returns it to clients.
- Spring Boot tracing is enabled through Micrometer OpenTelemetry bridge, which populates `traceId` and `spanId` in MDC.
- `GlobalExceptionHandler` now returns `correlationId` and `traceId` in API error responses.

### Security hardening

- `spring.jpa.open-in-view=false`
- Strict transport security, permissions policy, frame deny, referrer policy, and secure CORS defaults
- Actuator health endpoints are exposed for probes; the rest of the API remains JWT-protected.
- Password reset tokens are no longer printed by default.

### CSRF strategy

This API is stateless and uses bearer tokens in the `Authorization` header, not cookie-based session authentication.
Disabling CSRF is correct here because the browser does not automatically attach the bearer token to cross-site requests.
If you later move JWTs into cookies, re-enable CSRF with a token repository and same-site cookie strategy.

## Maven changes

Added:

- `shedlock-spring`
- `shedlock-provider-jdbc-template`
- `micrometer-tracing-bridge-otel`
- `micrometer-registry-prometheus`
- `logstash-logback-encoder`
- `applicationinsights-runtime-attach`
- `spring-boot-configuration-processor`

## Terraform deployment model

### Provisioned resources

- Resource Group
- Azure Container Registry Premium
- Azure Container Apps Environment
- Azure Container App for backend
- Azure Database for PostgreSQL Flexible Server
- Azure Key Vault
- Azure Static Web App
- Log Analytics Workspace
- Application Insights
- Azure Front Door Standard with WAF rate limiting
- Azure Monitor diagnostic settings
- Azure Monitor alerts

### Networking notes

- The included Terraform keeps PostgreSQL reachable through Azure service firewall access so Container Apps can connect without extra network plumbing.
- For a stricter enterprise posture, the next step is Container Apps VNet injection plus private PostgreSQL access with private DNS. That upgrade is operationally heavier but worthwhile for regulated workloads.

### Autoscaling

The backend is configured with:

- Minimum replicas: staging `2`, production `3`
- Maximum replicas: staging `6`, production `12`
- HTTP concurrency scaling rule
- CPU utilization scale rule at `70%`
- Memory utilization scale rule at `80%`

## Azure CLI bootstrap

### 1. Login and select subscription

```bash
az login
az account set --subscription <SUBSCRIPTION_ID>
```

### 2. Create remote Terraform state storage

```bash
az group create --name tfstate-rg --location eastus2
az storage account create \
  --name <globally-unique-state-account> \
  --resource-group tfstate-rg \
  --location eastus2 \
  --sku Standard_LRS
az storage container create \
  --name tfstate \
  --account-name <globally-unique-state-account>
```

### 3. Create the GitHub deployment service principal

```bash
az ad sp create-for-rbac \
  --name personal-finance-tracker-github \
  --role Contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>
```

The GitHub deployment identity also needs role-assignment capability. In real production, grant:

- `Contributor`
- `User Access Administrator`

Prefer federated credentials with `azure/login` OIDC rather than a long-lived client secret.

### 4. Create GitHub federated credentials

```bash
az ad app federated-credential create \
  --id <APP_REGISTRATION_OBJECT_ID> \
  --parameters '{
    "name":"github-main",
    "issuer":"https://token.actions.githubusercontent.com",
    "subject":"repo:<ORG>/<REPO>:environment:production",
    "audiences":["api://AzureADTokenExchange"]
  }'

az ad app federated-credential create \
  --id <APP_REGISTRATION_OBJECT_ID> \
  --parameters '{
    "name":"github-develop",
    "issuer":"https://token.actions.githubusercontent.com",
    "subject":"repo:<ORG>/<REPO>:environment:staging",
    "audiences":["api://AzureADTokenExchange"]
  }'
```

### 5. Initialize Terraform

```bash
cd infra/azure/terraform
terraform init -backend-config=backend.hcl.example
terraform plan -var-file=staging.tfvars
terraform apply -var-file=staging.tfvars
terraform plan -var-file=production.tfvars
terraform apply -var-file=production.tfvars
```

## GitHub environment configuration

Create two GitHub Environments:

- `staging`
- `production`

For each environment set secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_STATIC_WEB_APPS_API_TOKEN`

For each environment set variables:

- `ACR_NAME`
- `ACR_LOGIN_SERVER`
- `ACR_REPOSITORY`
- `RESOURCE_GROUP`
- `CONTAINER_APP_NAME`
- `HEALTHCHECK_URL`
- `VITE_API_BASE_URL`

Populate them from `terraform output`.

## Deployment flow

### First-time infrastructure rollout

1. Copy `staging.tfvars.example` to `staging.tfvars` and `production.tfvars.example` to `production.tfvars`.
2. Set the subscription and alert values.
3. Run Terraform apply for staging, validate, then run it for production.
4. Capture Terraform outputs and load them into GitHub Environment variables and secrets.

### Backend deployment

1. Push to `develop` to deploy staging.
2. Push to `main` to deploy production.
3. The workflow runs `mvn verify`, builds the backend image, pushes `${GITHUB_SHA}` and `latest`, updates Container Apps, then shifts 100% of traffic to the newest ready revision.

### Frontend deployment

1. Set `VITE_API_BASE_URL` per GitHub Environment.
2. Push the branch or run the workflow manually.
3. Static Web Apps builds and publishes the frontend separately from the backend.

## Rollback strategy

### Revision rollback

Container Apps keeps prior revisions. To roll back:

1. Open the `backend-cicd` workflow manually.
2. Select the environment.
3. Provide the previous image SHA in `image_tag`.
4. Re-run deployment.

### Blue-green operating model

Use staging as the green validation lane and production as the blue serving lane:

1. Ship every commit to staging from `develop`.
2. Run smoke tests and API tests on staging.
3. Promote the known-good commit to `main`.
4. Production creates a fresh revision and only shifts traffic after the rollout completes.

If you want literal same-environment blue-green traffic labels, extend the workflow to pin revisions to `blue` and `green` labels and flip Front Door origin routing only after canary validation.

## Monitoring setup

### Application Insights

- Runtime attach activates automatically when `APPLICATIONINSIGHTS_CONNECTION_STRING` is present.
- Request tracing, dependencies, exceptions, and JVM telemetry become visible in Application Insights.

### Log Analytics

- Container stdout JSON logs land in Log Analytics through Container Apps diagnostics.
- ACR, Key Vault, PostgreSQL, and Container Apps diagnostics are also enabled.

### Actuator

Exposed endpoints:

- `/actuator/health`
- `/actuator/health/liveness`
- `/actuator/health/readiness`
- `/actuator/info`
- `/actuator/metrics`
- `/actuator/prometheus`

### Alerts

- High CPU
- High memory
- Failing health endpoint via Application Insights web test

## CORS and environment separation

- Staging and production get separate Azure resources, secrets, databases, and frontend URLs.
- Backend CORS is environment-driven through `APP_FRONTEND_URL`.
- Swagger is enabled in staging and disabled in production through Terraform variable `springdoc_enabled`.

## Cost optimization notes

- Container Apps autoscaling keeps staging inexpensive with low min/max replica counts.
- Log Analytics retention is set to `30` days; tune down further if your compliance posture allows it.
- Front Door Standard plus WAF is the main premium add-on. If your traffic is low, you can temporarily disable Front Door and rely on Bucket4j while accepting weaker edge protection.
- PostgreSQL sizing is intentionally moderate. Revisit after you capture real workload metrics.

## Best practices

- Keep Terraform state in a dedicated subscription or platform resource group with access tightly scoped.
- Use separate ACR repositories per environment to keep `latest` safe.
- Never store GitHub deployment credentials in source control.
- Keep Key Vault secret rotation outside the app release cadence.
- Treat database schema changes as first-class release artifacts and always validate Flyway on staging before production.
- Add smoke tests against `/actuator/health/readiness`, `/api/auth/login`, and one authenticated business endpoint before production cutover.

## Production checklist

- Terraform state backend created and locked down
- Staging environment applied successfully
- Production environment applied successfully
- GitHub OIDC federated credentials configured
- GitHub environment secrets and variables populated
- `VITE_API_BASE_URL` points to the correct environment backend URL
- Key Vault contains JWT, DB, and Application Insights secrets
- Container App managed identity can read Key Vault secrets
- Container App managed identity has `AcrPull`
- Front Door WAF enabled with rate-limit rule
- PostgreSQL firewall reviewed and monitored
- Swagger disabled in production
- Alerts wired to a monitored inbox or on-call system
- Rollback tested with a prior image SHA
- Backup retention and restore drill validated
