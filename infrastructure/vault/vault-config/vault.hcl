ui = true
disable_mlock = true

storage "file" {
  path = "/vault/data"
}

listener "tcp" {
  address = "0.0.0.0:8200"
  tls_disable = 1
}

api_addr = "http://0.0.0.0:8200"
cluster_addr = "http://0.0.0.0:8201"

# Enable audit logging
audit {
  file {
    file_path = "/vault/logs/audit.log"
    log_raw = false
    format = "json"
  }
}

# Default lease settings
default_lease_ttl = "168h"
max_lease_ttl = "720h"

# Plugin directory
plugin_directory = "/vault/plugins"

# Enable raw endpoint (for health checks)
raw_storage_endpoint = true

# Telemetry
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname = true
}
