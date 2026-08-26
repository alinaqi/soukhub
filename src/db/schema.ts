import { pgTable, index, foreignKey, unique, pgPolicy, check, uuid, text, numeric, jsonb, timestamp, integer, boolean, type AnyPgColumn, uniqueIndex, pgMaterializedView, bigint, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { customType } from "drizzle-orm/pg-core"

// drizzle has no built-in tsvector; managed by SQL trigger (see 0000_baseline.sql)
const tsvector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

export const activityType = pgEnum("activity_type", ['order_created', 'order_updated', 'order_shipped', 'order_delivered', 'inventory_updated', 'listing_created', 'listing_updated', 'price_changed', 'sync_completed', 'sync_failed', 'ai_suggestion', 'ai_action'])
export const connectionStatus = pgEnum("connection_status", ['pending', 'active', 'error', 'disconnected'])
export const fulfillmentModel = pgEnum("fulfillment_model", ['self_fulfilled', 'supplier_fulfilled', 'hybrid'])
export const fulfillmentType = pgEnum("fulfillment_type", ['fbs', 'fbc', 'fbm', 'easy_ship', 'self_ship'])
export const inventoryLocation = pgEnum("inventory_location", ['at_supplier', 'ordered', 'in_transit', 'at_warehouse', 'reserved', 'packed', 'shipped'])
export const listingStatus = pgEnum("listing_status", ['draft', 'active', 'paused', 'out_of_stock', 'error'])
export const marketplaceType = pgEnum("marketplace_type", ['amazon', 'cartlow', 'revibe', 'noon', 'other'])
export const messageDirection = pgEnum("message_direction", ['outgoing', 'incoming'])
export const messageStatus = pgEnum("message_status", ['pending', 'sent', 'delivered', 'read', 'failed'])
export const orderStatus = pgEnum("order_status", ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'])
export const paymentMethod = pgEnum("payment_method", ['card', 'cod', 'tabby', 'tamara', 'payjustnow', 'payflex', 'bank_transfer', 'other'])
export const personalizedMessageType = pgEnum("personalized_message_type", ['thank_you', 'birthday', 'referral', 'custom'])
export const productAvailability = pgEnum("product_availability", ['in_stock', 'available_on_demand', 'discontinued'])
export const productCondition = pgEnum("product_condition", ['new', 'excellent', 'very_good', 'good', 'fair', 'renewed'])
export const supplierOrderStatus = pgEnum("supplier_order_status", ['pending_send', 'sent', 'confirmed', 'unavailable', 'alternative_offered', 'delivered_to_seller', 'packed', 'shipped'])
export const teamRole = pgEnum("team_role", ['owner', 'manager', 'packer', 'viewer'])
export const templateType = pgEnum("template_type", ['supplier_order', 'supplier_batch', 'customer_update', 'thank_you', 'referral'])
export const whatsappStatus = pgEnum("whatsapp_status", ['disconnected', 'connecting', 'connected', 'error'])
export const workflowRuleType = pgEnum("workflow_rule_type", ['packing', 'shipping', 'receiving', 'order_priority'])


export const marketplaceListings = pgTable("marketplace_listings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	variantId: uuid("variant_id").notNull(),
	connectionId: uuid("connection_id").notNull(),
	marketplaceSku: text("marketplace_sku"),
	marketplaceProductId: text("marketplace_product_id"),
	listingUrl: text("listing_url"),
	price: numeric({ precision: 10, scale:  2 }),
	status: listingStatus().default('draft'),
	syncStatus: jsonb("sync_status").default({}),
	lastSyncAt: timestamp("last_sync_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_listings_connection").using("btree", table.connectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_listings_variant").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "marketplace_listings_variant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.connectionId],
			foreignColumns: [marketplaceConnections.id],
			name: "marketplace_listings_connection_id_fkey"
		}).onDelete("cascade"),
	unique("marketplace_listings_variant_id_connection_id_key").on(table.variantId, table.connectionId),
	pgPolicy("org_members_listings", { as: "permissive", for: "all", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (product_variants pv
     JOIN products p ON ((p.id = pv.product_id)))
  WHERE ((pv.id = marketplace_listings.variant_id) AND is_org_member(p.org_id))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM (product_variants pv
     JOIN products p ON ((p.id = pv.product_id)))
  WHERE ((pv.id = marketplace_listings.variant_id) AND is_org_member(p.org_id))))`  }),
	check("marketplace_listings_price_check", sql`price >= (0)::numeric`),
]);

export const inventory = pgTable("inventory", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	variantId: uuid("variant_id").notNull(),
	connectionId: uuid("connection_id"),
	quantity: integer().default(0).notNull(),
	reserved: integer().default(0).notNull(),
	warehouseLocation: text("warehouse_location"),
	reorderPoint: integer("reorder_point").default(5),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_inventory_low_stock").using("btree", table.quantity.asc().nullsLast().op("int4_ops")).where(sql`(quantity <= 5)`),
	index("idx_inventory_variant").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "inventory_variant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.connectionId],
			foreignColumns: [marketplaceConnections.id],
			name: "inventory_connection_id_fkey"
		}).onDelete("set null"),
	unique("inventory_variant_id_connection_id_key").on(table.variantId, table.connectionId),
	pgPolicy("org_members_inventory", { as: "permissive", for: "all", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM (product_variants pv
     JOIN products p ON ((p.id = pv.product_id)))
  WHERE ((pv.id = inventory.variant_id) AND is_org_member(p.org_id))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM (product_variants pv
     JOIN products p ON ((p.id = pv.product_id)))
  WHERE ((pv.id = inventory.variant_id) AND is_org_member(p.org_id))))`  }),
	check("inventory_quantity_check", sql`quantity >= 0`),
	check("inventory_reserved_check", sql`reserved >= 0`),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	variantId: uuid("variant_id"),
	marketplaceSku: text("marketplace_sku"),
	productName: text("product_name").notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 10, scale:  2 }).notNull(),
	condition: productCondition(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_order_items_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_order_items_variant").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "order_items_variant_id_fkey"
		}).onDelete("set null"),
	pgPolicy("org_members_order_items", { as: "permissive", for: "all", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND is_org_member(o.org_id))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM orders o
  WHERE ((o.id = order_items.order_id) AND is_org_member(o.org_id))))`  }),
	check("order_items_quantity_check", sql`quantity > 0`),
	check("order_items_unit_price_check", sql`unit_price >= (0)::numeric`),
	check("order_items_total_price_check", sql`total_price >= (0)::numeric`),
]);

export const activityLog = pgTable("activity_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	activityType: activityType("activity_type").notNull(),
	title: text().notNull(),
	description: text(),
	metadata: jsonb().default({}),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_activity_unread").using("btree", table.userId.asc().nullsLast().op("uuid_ops")).where(sql`(is_read = false)`),
	index("idx_activity_user").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "activity_log_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view own activity", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	pgPolicy("Users can update own activity", { as: "permissive", for: "update", to: ["public"] }),
]);

export const profiles = pgTable("profiles", {
	id: uuid().primaryKey().notNull(),
	email: text().notNull(),
	fullName: text("full_name"),
	businessName: text("business_name"),
	phone: text(),
	country: text().default('AE'),
	currency: text().default('AED'),
	onboardingCompleted: boolean("onboarding_completed").default(false),
	onboardingStep: integer("onboarding_step").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	organizationId: uuid("organization_id"),
}, (table) => [
	// FK to auth.users lives in SQL (auth schema is Supabase-managed)
	// FK profiles.organization_id -> organizations.id kept in SQL to avoid a TS type cycle
	pgPolicy("Users can view own profile", { as: "permissive", for: "select", to: ["public"], using: sql`(auth.uid() = id)` }),
	pgPolicy("Users can update own profile", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can insert own profile", { as: "permissive", for: "insert", to: ["public"] }),
]);

export const teamMembers = pgTable("team_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	organizationId: uuid("organization_id").notNull(),
	ownerUserId: uuid("owner_user_id").notNull(),
	role: teamRole().default('viewer').notNull(),
	name: text().notNull(),
	email: text(),
	phone: text(),
	pinCode: text("pin_code"),
	isActive: boolean("is_active").default(true),
	permissions: jsonb().default({}),
	lastActiveAt: timestamp("last_active_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_team_members_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("idx_team_members_owner").using("btree", table.ownerUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_team_members_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_team_members_user_org").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.organizationId.asc().nullsLast().op("uuid_ops")).where(sql`(user_id IS NOT NULL)`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "team_members_user_id_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "team_members_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ownerUserId],
			foreignColumns: [profiles.id],
			name: "team_members_owner_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Owner can manage team", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = owner_user_id)` }),
	pgPolicy("Members can view self", { as: "permissive", for: "select", to: ["public"] }),
]);

export const teamSessions = pgTable("team_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamMemberId: uuid("team_member_id").notNull(),
	deviceId: text("device_id"),
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	endedAt: timestamp("ended_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_team_sessions_member").using("btree", table.teamMemberId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamMemberId],
			foreignColumns: [teamMembers.id],
			name: "team_sessions_team_member_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Members can manage own sessions", { as: "permissive", for: "all", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM team_members tm
  WHERE ((tm.id = team_sessions.team_member_id) AND ((tm.user_id = auth.uid()) OR (tm.owner_user_id = auth.uid())))))` }),
]);

export const whatsappConnections = pgTable("whatsapp_connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	status: whatsappStatus().default('disconnected'),
	phoneNumber: text("phone_number"),
	lastConnectedAt: timestamp("last_connected_at", { withTimezone: true, mode: 'string' }),
	sessionData: text("session_data"),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_whatsapp_connections_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "whatsapp_connections_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "whatsapp_connections_organization_id_fkey"
		}).onDelete("cascade"),
	unique("whatsapp_connections_user_id_key").on(table.userId),
	pgPolicy("Users can manage own whatsapp", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
]);

export const inventoryMovements = pgTable("inventory_movements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	variantId: uuid("variant_id"),
	fromLocation: inventoryLocation("from_location"),
	toLocation: inventoryLocation("to_location").notNull(),
	quantity: integer().notNull(),
	orderId: uuid("order_id"),
	supplierOrderId: uuid("supplier_order_id"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_inventory_movements_date").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_inventory_movements_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_inventory_movements_variant").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "inventory_movements_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "inventory_movements_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [productVariants.id],
			name: "inventory_movements_variant_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "inventory_movements_order_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.supplierOrderId],
			foreignColumns: [supplierOrders.id],
			name: "inventory_movements_supplier_order_id_fkey"
		}).onDelete("set null"),
	pgPolicy("Users can manage own inventory movements", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
	check("inventory_movements_quantity_check", sql`quantity > 0`),
]);

export const supplierProductAvailability = pgTable("supplier_product_availability", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	supplierId: uuid("supplier_id").notNull(),
	productName: text("product_name").notNull(),
	brand: text(),
	model: text(),
	isAvailable: boolean("is_available"),
	lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true, mode: 'string' }),
	avgFulfillmentHours: integer("avg_fulfillment_hours"),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_supplier_availability_product").using("btree", table.productName.asc().nullsLast().op("text_ops"), table.brand.asc().nullsLast().op("text_ops")),
	index("idx_supplier_availability_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "supplier_product_availability_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "supplier_product_availability_supplier_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can manage supplier availability", { as: "permissive", for: "all", to: ["public"], using: sql`(auth.uid() = user_id)` }),
]);

export const marketplaceConnections = pgTable("marketplace_connections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	marketplace: marketplaceType().notNull(),
	displayName: text("display_name").notNull(),
	credentials: jsonb(),
	settings: jsonb().default({}),
	status: connectionStatus().default('pending'),
	lastSyncAt: timestamp("last_sync_at", { withTimezone: true, mode: 'string' }),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_marketplace_connections_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "marketplace_connections_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "marketplace_connections_org_id_fkey"
		}),
	unique("marketplace_connections_user_id_marketplace_key").on(table.userId, table.marketplace),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	connectionId: uuid("connection_id"),
	marketplace: marketplaceType().notNull(),
	marketplaceOrderId: text("marketplace_order_id").notNull(),
	status: orderStatus().default('pending'),
	fulfillment: fulfillmentType(),
	paymentMethod: paymentMethod("payment_method"),
	customerName: text("customer_name"),
	customerEmail: text("customer_email"),
	customerPhone: text("customer_phone"),
	shippingAddress: jsonb("shipping_address"),
	shippingCity: text("shipping_city"),
	shippingCountry: text("shipping_country").default('AE'),
	subtotal: numeric({ precision: 10, scale:  2 }).default('0'),
	shippingCost: numeric("shipping_cost", { precision: 10, scale:  2 }).default('0'),
	tax: numeric({ precision: 10, scale:  2 }).default('0'),
	discount: numeric({ precision: 10, scale:  2 }).default('0'),
	total: numeric({ precision: 10, scale:  2 }).default('0'),
	currency: text().default('AED'),
	orderDate: timestamp("order_date", { withTimezone: true, mode: 'string' }).notNull(),
	shipDate: timestamp("ship_date", { withTimezone: true, mode: 'string' }),
	deliveryDate: timestamp("delivery_date", { withTimezone: true, mode: 'string' }),
	trackingNumber: text("tracking_number"),
	carrier: text(),
	notes: text(),
	rawData: jsonb("raw_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	supplierOrderId: uuid("supplier_order_id"),
	requiresSupplier: boolean("requires_supplier").default(true),
	routedAt: timestamp("routed_at", { withTimezone: true, mode: 'string' }),
	unavailableHandled: boolean("unavailable_handled").default(false),
	alternativeOfferedProductId: uuid("alternative_offered_product_id"),
	customerResponse: text("customer_response"),
	customerId: uuid("customer_id"),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_orders_connection").using("btree", table.connectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_date").using("btree", table.orderDate.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_orders_marketplace").using("btree", table.marketplace.asc().nullsLast().op("enum_ops")),
	index("idx_orders_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_orders_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "orders_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.connectionId],
			foreignColumns: [marketplaceConnections.id],
			name: "orders_connection_id_fkey"
		}).onDelete("set null"),
	// FK orders.supplier_order_id -> supplier_orders.id kept in SQL to avoid a TS type cycle
	foreignKey({
			columns: [table.alternativeOfferedProductId],
			foreignColumns: [products.id],
			name: "orders_alternative_offered_product_id_fkey"
		}),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "orders_customer_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "orders_org_id_fkey"
		}),
	unique("orders_user_id_marketplace_marketplace_order_id_key").on(table.userId, table.marketplace, table.marketplaceOrderId),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
	check("orders_subtotal_check", sql`subtotal >= (0)::numeric`),
	check("orders_shipping_cost_check", sql`shipping_cost >= (0)::numeric`),
	check("orders_tax_check", sql`tax >= (0)::numeric`),
	check("orders_discount_check", sql`discount >= (0)::numeric`),
	check("orders_total_check", sql`total >= (0)::numeric`),
	check("orders_check", sql`(ship_date IS NULL) OR (ship_date >= order_date)`),
	check("orders_check1", sql`(delivery_date IS NULL) OR (delivery_date >= order_date)`),
	check("orders_customer_response_check", sql`customer_response = ANY (ARRAY['pending'::text, 'accepted_alternative'::text, 'cancelled'::text, 'no_response'::text])`),
]);

export const workflowConfig = pgTable("workflow_config", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	fulfillmentModel: fulfillmentModel("fulfillment_model").default('supplier_fulfilled'),
	packingLocation: text("packing_location"),
	deliverySchedule: jsonb("delivery_schedule").default({}),
	autoRouteOrders: boolean("auto_route_orders").default(true),
	autoSendSupplierMessages: boolean("auto_send_supplier_messages").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_workflow_config_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_workflow_config_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "workflow_config_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "workflow_config_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "workflow_config_org_id_fkey"
		}),
	unique("workflow_config_user_id_key").on(table.userId),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
]);

export const suppliers = pgTable("suppliers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	name: text().notNull(),
	whatsappNumber: text("whatsapp_number").notNull(),
	secondaryWhatsapp: text("secondary_whatsapp"),
	email: text(),
	secondaryEmail: text("secondary_email"),
	preferredContact: text("preferred_contact").default('whatsapp'),
	contactNotes: text("contact_notes"),
	deliveryTimes: text("delivery_times").array(),
	notes: text(),
	isActive: boolean("is_active").default(true),
	avgResponseMinutes: integer("avg_response_minutes"),
	avgFulfillmentHours: integer("avg_fulfillment_hours"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_suppliers_active").using("btree", table.userId.asc().nullsLast().op("uuid_ops")).where(sql`(is_active = true)`),
	index("idx_suppliers_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_suppliers_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "suppliers_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "suppliers_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "suppliers_org_id_fkey"
		}),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
	check("suppliers_preferred_contact_check", sql`preferred_contact = ANY (ARRAY['whatsapp'::text, 'email'::text, 'both'::text])`),
]);

export const supplierBrandRules = pgTable("supplier_brand_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	supplierId: uuid("supplier_id").notNull(),
	brand: text().notNull(),
	category: text(),
	priority: integer().default(1),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_supplier_brand_rules_brand").using("btree", table.brand.asc().nullsLast().op("text_ops")),
	index("idx_supplier_brand_rules_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_supplier_brand_rules_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_supplier_brand_rules_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "supplier_brand_rules_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "supplier_brand_rules_supplier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "supplier_brand_rules_org_id_fkey"
		}),
	unique("supplier_brand_rules_user_id_brand_category_priority_key").on(table.userId, table.brand, table.category, table.priority),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
]);

export const supplierOrders = pgTable("supplier_orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	supplierId: uuid("supplier_id").notNull(),
	orderId: uuid("order_id").notNull(),
	status: supplierOrderStatus().default('pending_send'),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	sentVia: text("sent_via"),
	supplierResponse: text("supplier_response"),
	alternativeProduct: text("alternative_product"),
	responseConfidence: numeric("response_confidence", { precision: 3, scale:  2 }),
	requiresManualReview: boolean("requires_manual_review").default(false),
	expectedDeliveryAt: timestamp("expected_delivery_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	packedAt: timestamp("packed_at", { withTimezone: true, mode: 'string' }),
	shippedAt: timestamp("shipped_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_supplier_orders_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_supplier_orders_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_supplier_orders_pending").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")).where(sql`(status = ANY (ARRAY['pending_send'::supplier_order_status, 'sent'::supplier_order_status]))`),
	index("idx_supplier_orders_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_supplier_orders_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_supplier_orders_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "supplier_orders_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "supplier_orders_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "supplier_orders_supplier_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "supplier_orders_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "supplier_orders_org_id_fkey"
		}),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
	check("supplier_orders_sent_via_check", sql`sent_via = ANY (ARRAY['whatsapp'::text, 'email'::text, 'both'::text])`),
]);

export const messageTemplates = pgTable("message_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	name: text().notNull(),
	templateType: templateType("template_type").notNull(),
	content: text().notNull(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_message_templates_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_message_templates_type").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.templateType.asc().nullsLast().op("uuid_ops")),
	index("idx_message_templates_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "message_templates_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "message_templates_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "message_templates_org_id_fkey"
		}),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
]);

export const whatsappMessages = pgTable("whatsapp_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	supplierOrderId: uuid("supplier_order_id"),
	supplierId: uuid("supplier_id"),
	direction: messageDirection().notNull(),
	phoneNumber: text("phone_number").notNull(),
	messageContent: text("message_content").notNull(),
	status: messageStatus().default('pending'),
	whatsappMessageId: text("whatsapp_message_id"),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	parsedIntent: text("parsed_intent"),
	parsedData: jsonb("parsed_data"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_whatsapp_messages_order").using("btree", table.supplierOrderId.asc().nullsLast().op("uuid_ops")),
	index("idx_whatsapp_messages_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_whatsapp_messages_phone").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")),
	index("idx_whatsapp_messages_supplier").using("btree", table.supplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_whatsapp_messages_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "whatsapp_messages_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "whatsapp_messages_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.supplierOrderId],
			foreignColumns: [supplierOrders.id],
			name: "whatsapp_messages_supplier_order_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "whatsapp_messages_supplier_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "whatsapp_messages_org_id_fkey"
		}),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
]);

export const customers = pgTable("customers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	email: text(),
	phone: text(),
	name: text(),
	totalOrders: integer("total_orders").default(0),
	totalSpent: numeric("total_spent", { precision: 12, scale:  2 }).default('0'),
	firstOrderDate: timestamp("first_order_date", { withTimezone: true, mode: 'string' }),
	lastOrderDate: timestamp("last_order_date", { withTimezone: true, mode: 'string' }),
	tags: text().array(),
	notes: text(),
	isVip: boolean("is_vip").default(false),
	preferredContactMethod: text("preferred_contact_method"),
	addresses: jsonb().default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_customers_email").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.email.asc().nullsLast().op("uuid_ops")),
	index("idx_customers_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_customers_phone").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.phone.asc().nullsLast().op("text_ops")),
	index("idx_customers_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_customers_vip").using("btree", table.userId.asc().nullsLast().op("uuid_ops")).where(sql`(is_vip = true)`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "customers_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "customers_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "customers_org_id_fkey"
		}),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
]);

export const customerMatchRules = pgTable("customer_match_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	matchBy: text("match_by").notNull(),
	priority: integer().default(1),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_customer_match_rules_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "customer_match_rules_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "customer_match_rules_org_id_fkey"
		}),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
	check("customer_match_rules_match_by_check", sql`match_by = ANY (ARRAY['email'::text, 'phone'::text, 'name_and_city'::text])`),
]);

export const referralCodes = pgTable("referral_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id"),
	customerId: uuid("customer_id"),
	code: text().notNull(),
	discountPercent: integer("discount_percent"),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }),
	maxUses: integer("max_uses"),
	timesUsed: integer("times_used").default(0),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_referral_codes_code").using("btree", table.code.asc().nullsLast().op("text_ops")),
	index("idx_referral_codes_customer").using("btree", table.customerId.asc().nullsLast().op("uuid_ops")),
	index("idx_referral_codes_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_referral_codes_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "referral_codes_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "referral_codes_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "referral_codes_customer_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "referral_codes_org_id_fkey"
		}),
	unique("referral_codes_code_key").on(table.code),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
	check("referral_codes_discount_percent_check", sql`(discount_percent >= 0) AND (discount_percent <= 100)`),
	check("referral_codes_discount_amount_check", sql`discount_amount >= (0)::numeric`),
]);

export const personalizedMessages = pgTable("personalized_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	orderId: uuid("order_id"),
	customerId: uuid("customer_id"),
	messageType: personalizedMessageType("message_type").notNull(),
	content: text().notNull(),
	printed: boolean().default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_personalized_messages_order").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_personalized_messages_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "personalized_messages_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "personalized_messages_order_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customers.id],
			name: "personalized_messages_customer_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "personalized_messages_org_id_fkey"
		}),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
]);

export const workflowRules = pgTable("workflow_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id"),
	userId: uuid("user_id").notNull(),
	ruleType: workflowRuleType("rule_type").notNull(),
	config: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	orgId: uuid("org_id"),
}, (table) => [
	index("idx_workflow_rules_org").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "workflow_rules_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "workflow_rules_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "workflow_rules_org_id_fkey"
		}),
	unique("workflow_rules_organization_id_rule_type_key").on(table.organizationId, table.ruleType),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	brand: text(),
	category: text(),
	description: text(),
	basePrice: numeric("base_price", { precision: 10, scale:  2 }),
	costPrice: numeric("cost_price", { precision: 10, scale:  2 }),
	images: jsonb().default([]),
	attributes: jsonb().default({}),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	availabilityType: productAvailability("availability_type").default('available_on_demand'),
	preferredSupplierId: uuid("preferred_supplier_id"),
	orgId: uuid("org_id"),
	isPublished: boolean("is_published").default(false).notNull(),
	titleAr: text("title_ar"),
	descriptionAr: text("description_ar"),
	slug: text(),
	shortId: text("short_id").default(sql`lower(substr(encode(gen_random_bytes(6), 'hex'::text), 1, 8))`),
	searchVector: tsvector("search_vector"),
}, (table) => [
	index("idx_products_brand").using("btree", table.brand.asc().nullsLast().op("text_ops")),
	index("idx_products_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_products_name_trgm").using("gin", sql`((COALESCE(name, ''::text) || ' '::text) || COALESCE(brand, ''::text)) gin_trgm_ops`),
	index("idx_products_org").using("btree", table.orgId.asc().nullsLast().op("uuid_ops")),
	index("idx_products_published").using("btree", table.isPublished.asc().nullsLast().op("uuid_ops"), table.orgId.asc().nullsLast().op("uuid_ops")).where(sql`is_published`),
	index("idx_products_search_vector").using("gin", table.searchVector.asc().nullsLast().op("tsvector_ops")),
	index("idx_products_supplier").using("btree", table.preferredSupplierId.asc().nullsLast().op("uuid_ops")),
	index("idx_products_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [profiles.id],
			name: "products_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.preferredSupplierId],
			foreignColumns: [suppliers.id],
			name: "products_preferred_supplier_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.orgId],
			foreignColumns: [organizations.id],
			name: "products_org_id_fkey"
		}),
	unique("products_short_id_key").on(table.shortId),
	pgPolicy("org_members_all", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(org_id)`, withCheck: sql`is_org_member(org_id)`  }),
	pgPolicy("public_read_published_products", { as: "permissive", for: "select", to: ["public"] }),
	check("products_base_price_check", sql`base_price >= (0)::numeric`),
	check("products_cost_price_check", sql`cost_price >= (0)::numeric`),
]);

export const productVariants = pgTable("product_variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	sku: text().notNull(),
	name: text(),
	color: text(),
	storage: text(),
	condition: productCondition().default('new'),
	price: numeric({ precision: 10, scale:  2 }),
	cost: numeric({ precision: 10, scale:  2 }),
	weightGrams: integer("weight_grams"),
	dimensions: jsonb(),
	barcode: text(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_variants_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_variants_sku").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_variants_product_id_fkey"
		}).onDelete("cascade"),
	unique("product_variants_product_id_sku_key").on(table.productId, table.sku),
	pgPolicy("org_members_variants", { as: "permissive", for: "all", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_variants.product_id) AND is_org_member(p.org_id))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM products p
  WHERE ((p.id = product_variants.product_id) AND is_org_member(p.org_id))))`  }),
	pgPolicy("public_read_published_variants", { as: "permissive", for: "select", to: ["public"] }),
	check("product_variants_price_check", sql`price >= (0)::numeric`),
	check("product_variants_cost_check", sql`cost >= (0)::numeric`),
]);

export const organizations = pgTable("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ownerUserId: uuid("owner_user_id").notNull(),
	name: text().notNull(),
	settings: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	slug: text(),
	nameAr: text("name_ar"),
	logoUrl: text("logo_url"),
	bio: text(),
	bioAr: text("bio_ar"),
	isPublished: boolean("is_published").default(false).notNull(),
	commissionBps: integer("commission_bps").default(600).notNull(),
}, (table) => [
	index("idx_organizations_owner").using("btree", table.ownerUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_organizations_published").using("btree", table.isPublished.asc().nullsLast().op("bool_ops")).where(sql`is_published`),
	foreignKey({
			columns: [table.ownerUserId],
			foreignColumns: [profiles.id],
			name: "organizations_owner_user_id_fkey"
		}).onDelete("cascade"),
	unique("organizations_slug_key").on(table.slug),
	pgPolicy("org_members_manage", { as: "permissive", for: "all", to: ["public"], using: sql`is_org_member(id)`, withCheck: sql`is_org_member(id)`  }),
	pgPolicy("public_read_published_orgs", { as: "permissive", for: "select", to: ["public"] }),
	check("organizations_commission_bps_check", sql`(commission_bps >= 0) AND (commission_bps <= 5000)`),
]);
export const orderPipelineCounts = pgMaterializedView("order_pipeline_counts", {	userId: uuid("user_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	newCount: bigint("new_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	processingCount: bigint("processing_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	confirmedCount: bigint("confirmed_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	readyCount: bigint("ready_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	shippedToday: bigint("shipped_today", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	deliveredToday: bigint("delivered_today", { mode: "number" }),
}).as(sql`SELECT user_id, count(*) FILTER (WHERE status = 'pending'::order_status) AS new_count, count(*) FILTER (WHERE status = 'processing'::order_status) AS processing_count, count(*) FILTER (WHERE status = 'confirmed'::order_status) AS confirmed_count, count(*) FILTER (WHERE status = 'ready_to_ship'::order_status) AS ready_count, count(*) FILTER (WHERE status = 'shipped'::order_status AND date(ship_date) = CURRENT_DATE) AS shipped_today, count(*) FILTER (WHERE status = 'delivered'::order_status AND date(delivery_date) = CURRENT_DATE) AS delivered_today FROM orders GROUP BY user_id`);

export const supplierOrderCounts = pgMaterializedView("supplier_order_counts", {	userId: uuid("user_id"),
	supplierId: uuid("supplier_id"),
	supplierName: text("supplier_name"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	pendingSendCount: bigint("pending_send_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	awaitingReplyCount: bigint("awaiting_reply_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	confirmedCount: bigint("confirmed_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	unavailableCount: bigint("unavailable_count", { mode: "number" }),
	avgResponseMinutes: numeric("avg_response_minutes"),
}).as(sql`SELECT so.user_id, so.supplier_id, s.name AS supplier_name, count(*) FILTER (WHERE so.status = 'pending_send'::supplier_order_status) AS pending_send_count, count(*) FILTER (WHERE so.status = 'sent'::supplier_order_status) AS awaiting_reply_count, count(*) FILTER (WHERE so.status = 'confirmed'::supplier_order_status) AS confirmed_count, count(*) FILTER (WHERE so.status = 'unavailable'::supplier_order_status) AS unavailable_count, avg(EXTRACT(epoch FROM so.updated_at - so.sent_at) / 60::numeric) FILTER (WHERE so.status = ANY (ARRAY['confirmed'::supplier_order_status, 'unavailable'::supplier_order_status])) AS avg_response_minutes FROM supplier_orders so JOIN suppliers s ON s.id = so.supplier_id WHERE so.created_at > (now() - '7 days'::interval) GROUP BY so.user_id, so.supplier_id, s.name`);

export const inventorySummary = pgMaterializedView("inventory_summary", {	userId: uuid("user_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalProducts: bigint("total_products", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	totalUnits: bigint("total_units", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	availableUnits: bigint("available_units", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	reservedUnits: bigint("reserved_units", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	lowStockCount: bigint("low_stock_count", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	outOfStockCount: bigint("out_of_stock_count", { mode: "number" }),
}).as(sql`SELECT p.user_id, count(DISTINCT p.id) AS total_products, COALESCE(sum(i.quantity), 0::bigint) AS total_units, COALESCE(sum(i.quantity - i.reserved), 0::bigint) AS available_units, COALESCE(sum(i.reserved), 0::bigint) AS reserved_units, count(*) FILTER (WHERE i.quantity > 0 AND i.quantity <= i.reorder_point) AS low_stock_count, count(*) FILTER (WHERE i.quantity = 0) AS out_of_stock_count FROM products p LEFT JOIN product_variants pv ON pv.product_id = p.id LEFT JOIN inventory i ON i.variant_id = pv.id GROUP BY p.user_id`);
// ============================================================
// External reference catalog (ADR 0016) — scraped market data
// (Amazon.ae / Cartlow / Revibe via Apify) that fills discovery
// and powers trade-in pricing. NOT seller listings.
// ============================================================
export const catalogProducts = pgTable("catalog_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	source: text().notNull(),
	sourceId: text("source_id").notNull(),
	url: text().notNull(),
	title: text().notNull(),
	titleAr: text("title_ar"),
	brand: text(),
	model: text(),
	category: text(),
	condition: text(),
	price: numeric({ precision: 10, scale: 2 }),
	currency: text().default('AED').notNull(),
	images: jsonb().default([]),
	attributes: jsonb().default({}),
	isActive: boolean("is_active").default(true).notNull(),
	scrapedAt: timestamp("scraped_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	searchVector: tsvector("search_vector"),
}, (table) => [
	unique("uq_catalog_source_item").on(table.source, table.sourceId),
	index("idx_catalog_brand").using("btree", table.brand.asc().nullsLast().op("text_ops")),
	index("idx_catalog_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_catalog_active").using("btree", table.isActive.asc().nullsLast()),
]);

// AI trade-in requests: photo assessment + valuation snapshot
export const tradeInRequests = pgTable("trade_in_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	contactPhone: text("contact_phone"),
	notes: text(),
	aiAssessment: jsonb("ai_assessment").default({}),
	estimatedValue: numeric("estimated_value", { precision: 10, scale: 2 }),
	currency: text().default('AED').notNull(),
	status: text().default('evaluated').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_tradein_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_tradein_created").using("btree", table.createdAt.desc().nullsFirst()),
]);

// Buyer interest in catalog items — sales complete ON SoukHub (operator
// confirms availability/fulfilment via WhatsApp), no outbound handoff.
export const catalogRequests = pgTable("catalog_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	catalogProductId: uuid("catalog_product_id").notNull(),
	userId: uuid("user_id"),
	name: text(),
	contactPhone: text("contact_phone").notNull(),
	note: text(),
	status: text().default('new').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_catalog_requests_item").using("btree", table.catalogProductId.asc().nullsLast().op("uuid_ops")),
	index("idx_catalog_requests_created").using("btree", table.createdAt.desc().nullsFirst()),
	foreignKey({
		columns: [table.catalogProductId],
		foreignColumns: [catalogProducts.id],
		name: "catalog_requests_item_fkey"
	}).onDelete("cascade"),
]);

// Cached web-review intelligence per product family (Gemini + Search grounding)
export const productReviews = pgTable("product_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productKey: text("product_key").notNull(),
	rating: numeric({ precision: 3, scale: 2 }),
	reviewCount: integer("review_count"),
	summary: text(),
	quotes: jsonb().default([]),
	fetchedAt: timestamp("fetched_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("uq_product_reviews_key").on(table.productKey),
]);

// ============================================================
// Provider directory (ADR 0017) — every mobile shop in the UAE,
// scraped from Google Maps via Apify. Talabat-style coverage:
// browse, call/WhatsApp, request from the nearest shop.
// ============================================================
export const providers = pgTable("providers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	googlePlaceId: text("google_place_id").notNull(),
	slug: text(),
	name: text().notNull(),
	phone: text(),
	whatsapp: text(),
	website: text(),
	address: text(),
	area: text(),
	emirate: text(),
	lat: numeric({ precision: 10, scale: 7 }),
	lng: numeric({ precision: 10, scale: 7 }),
	googleRating: numeric("google_rating", { precision: 2, scale: 1 }),
	googleReviewCount: integer("google_review_count"),
	category: text(),
	hours: jsonb().default({}),
	imageUrl: text("image_url"),
	isActive: boolean("is_active").default(true).notNull(),
	claimedOrgId: uuid("claimed_org_id"),
	claimedAt: timestamp("claimed_at", { withTimezone: true, mode: 'string' }),
	googleReviews: jsonb("google_reviews").default([]),
	scrapedAt: timestamp("scraped_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("uq_providers_place").on(table.googlePlaceId),
	index("idx_providers_emirate").using("btree", table.emirate.asc().nullsLast().op("text_ops")),
	index("idx_providers_active").using("btree", table.isActive.asc().nullsLast()),
]);

// Buyer requests routed to a specific provider (nearest-shop flow)
export const providerRequests = pgTable("provider_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	providerId: uuid("provider_id").notNull(),
	userId: uuid("user_id"),
	name: text(),
	contactPhone: text("contact_phone").notNull(),
	itemWanted: text("item_wanted").notNull(),
	deliveryAddress: text("delivery_address"),
	emirate: text(),
	status: text().default('new').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_provider_requests_provider").using("btree", table.providerId.asc().nullsLast().op("uuid_ops")),
	index("idx_provider_requests_created").using("btree", table.createdAt.desc().nullsFirst()),
	foreignKey({
		columns: [table.providerId],
		foreignColumns: [providers.id],
		name: "provider_requests_provider_fkey"
	}).onDelete("cascade"),
]);
