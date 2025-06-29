-- Create databases for different services
CREATE DATABASE IF NOT EXISTS keycloak;
CREATE DATABASE IF NOT EXISTS ecommerce_users;
CREATE DATABASE IF NOT EXISTS ecommerce_orders;
CREATE DATABASE IF NOT EXISTS ecommerce_payments;
CREATE DATABASE IF NOT EXISTS ecommerce_inventory;
CREATE DATABASE IF NOT EXISTS ecommerce_shipping;
CREATE DATABASE IF NOT EXISTS ecommerce_promotions;
CREATE DATABASE IF NOT EXISTS ecommerce_admin;

-- Create users for different services
CREATE USER IF NOT EXISTS keycloak_user WITH PASSWORD 'keycloak_pass';
CREATE USER IF NOT EXISTS user_service WITH PASSWORD 'user_pass';
CREATE USER IF NOT EXISTS order_service WITH PASSWORD 'order_pass';
CREATE USER IF NOT EXISTS payment_service WITH PASSWORD 'payment_pass';
CREATE USER IF NOT EXISTS inventory_service WITH PASSWORD 'inventory_pass';
CREATE USER IF NOT EXISTS shipping_service WITH PASSWORD 'shipping_pass';
CREATE USER IF NOT EXISTS promotion_service WITH PASSWORD 'promotion_pass';
CREATE USER IF NOT EXISTS admin_service WITH PASSWORD 'admin_pass';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak_user;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_users TO user_service;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_orders TO order_service;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_payments TO payment_service;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_inventory TO inventory_service;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_shipping TO shipping_service;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_promotions TO promotion_service;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_admin TO admin_service;
