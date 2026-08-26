import { relations } from "drizzle-orm/relations";
import { productVariants, marketplaceListings, marketplaceConnections, inventory, orders, orderItems, profiles, activityLog, organizations, teamMembers, teamSessions, whatsappConnections, inventoryMovements, supplierOrders, supplierProductAvailability, suppliers, products, customers, workflowConfig, supplierBrandRules, messageTemplates, whatsappMessages, customerMatchRules, referralCodes, personalizedMessages, workflowRules } from "./schema";

export const marketplaceListingsRelations = relations(marketplaceListings, ({one}) => ({
	productVariant: one(productVariants, {
		fields: [marketplaceListings.variantId],
		references: [productVariants.id]
	}),
	marketplaceConnection: one(marketplaceConnections, {
		fields: [marketplaceListings.connectionId],
		references: [marketplaceConnections.id]
	}),
}));

export const productVariantsRelations = relations(productVariants, ({one, many}) => ({
	marketplaceListings: many(marketplaceListings),
	inventories: many(inventory),
	orderItems: many(orderItems),
	inventoryMovements: many(inventoryMovements),
	product: one(products, {
		fields: [productVariants.productId],
		references: [products.id]
	}),
}));

export const marketplaceConnectionsRelations = relations(marketplaceConnections, ({one, many}) => ({
	marketplaceListings: many(marketplaceListings),
	inventories: many(inventory),
	profile: one(profiles, {
		fields: [marketplaceConnections.userId],
		references: [profiles.id]
	}),
	organization: one(organizations, {
		fields: [marketplaceConnections.orgId],
		references: [organizations.id]
	}),
	orders: many(orders),
}));

export const inventoryRelations = relations(inventory, ({one}) => ({
	productVariant: one(productVariants, {
		fields: [inventory.variantId],
		references: [productVariants.id]
	}),
	marketplaceConnection: one(marketplaceConnections, {
		fields: [inventory.connectionId],
		references: [marketplaceConnections.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	productVariant: one(productVariants, {
		fields: [orderItems.variantId],
		references: [productVariants.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	inventoryMovements: many(inventoryMovements),
	profile: one(profiles, {
		fields: [orders.userId],
		references: [profiles.id]
	}),
	marketplaceConnection: one(marketplaceConnections, {
		fields: [orders.connectionId],
		references: [marketplaceConnections.id]
	}),
	supplierOrder: one(supplierOrders, {
		fields: [orders.supplierOrderId],
		references: [supplierOrders.id],
		relationName: "orders_supplierOrderId_supplierOrders_id"
	}),
	product: one(products, {
		fields: [orders.alternativeOfferedProductId],
		references: [products.id]
	}),
	customer: one(customers, {
		fields: [orders.customerId],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [orders.orgId],
		references: [organizations.id]
	}),
	supplierOrders: many(supplierOrders, {
		relationName: "supplierOrders_orderId_orders_id"
	}),
	personalizedMessages: many(personalizedMessages),
}));

export const activityLogRelations = relations(activityLog, ({one}) => ({
	profile: one(profiles, {
		fields: [activityLog.userId],
		references: [profiles.id]
	}),
}));

export const profilesRelations = relations(profiles, ({one, many}) => ({
	activityLogs: many(activityLog),
	organization: one(organizations, {
		fields: [profiles.organizationId],
		references: [organizations.id],
		relationName: "profiles_organizationId_organizations_id"
	}),
	teamMembers_userId: many(teamMembers, {
		relationName: "teamMembers_userId_profiles_id"
	}),
	teamMembers_ownerUserId: many(teamMembers, {
		relationName: "teamMembers_ownerUserId_profiles_id"
	}),
	whatsappConnections: many(whatsappConnections),
	inventoryMovements: many(inventoryMovements),
	supplierProductAvailabilities: many(supplierProductAvailability),
	marketplaceConnections: many(marketplaceConnections),
	orders: many(orders),
	workflowConfigs: many(workflowConfig),
	suppliers: many(suppliers),
	supplierBrandRules: many(supplierBrandRules),
	supplierOrders: many(supplierOrders),
	messageTemplates: many(messageTemplates),
	whatsappMessages: many(whatsappMessages),
	customers: many(customers),
	customerMatchRules: many(customerMatchRules),
	referralCodes: many(referralCodes),
	personalizedMessages: many(personalizedMessages),
	workflowRules: many(workflowRules),
	products: many(products),
	organizations: many(organizations, {
		relationName: "organizations_ownerUserId_profiles_id"
	}),
}));

export const organizationsRelations = relations(organizations, ({one, many}) => ({
	profiles: many(profiles, {
		relationName: "profiles_organizationId_organizations_id"
	}),
	teamMembers: many(teamMembers),
	whatsappConnections: many(whatsappConnections),
	inventoryMovements: many(inventoryMovements),
	marketplaceConnections: many(marketplaceConnections),
	orders: many(orders),
	workflowConfigs_organizationId: many(workflowConfig, {
		relationName: "workflowConfig_organizationId_organizations_id"
	}),
	workflowConfigs_orgId: many(workflowConfig, {
		relationName: "workflowConfig_orgId_organizations_id"
	}),
	suppliers_organizationId: many(suppliers, {
		relationName: "suppliers_organizationId_organizations_id"
	}),
	suppliers_orgId: many(suppliers, {
		relationName: "suppliers_orgId_organizations_id"
	}),
	supplierBrandRules: many(supplierBrandRules),
	supplierOrders_organizationId: many(supplierOrders, {
		relationName: "supplierOrders_organizationId_organizations_id"
	}),
	supplierOrders_orgId: many(supplierOrders, {
		relationName: "supplierOrders_orgId_organizations_id"
	}),
	messageTemplates_organizationId: many(messageTemplates, {
		relationName: "messageTemplates_organizationId_organizations_id"
	}),
	messageTemplates_orgId: many(messageTemplates, {
		relationName: "messageTemplates_orgId_organizations_id"
	}),
	whatsappMessages_organizationId: many(whatsappMessages, {
		relationName: "whatsappMessages_organizationId_organizations_id"
	}),
	whatsappMessages_orgId: many(whatsappMessages, {
		relationName: "whatsappMessages_orgId_organizations_id"
	}),
	customers_organizationId: many(customers, {
		relationName: "customers_organizationId_organizations_id"
	}),
	customers_orgId: many(customers, {
		relationName: "customers_orgId_organizations_id"
	}),
	customerMatchRules: many(customerMatchRules),
	referralCodes_organizationId: many(referralCodes, {
		relationName: "referralCodes_organizationId_organizations_id"
	}),
	referralCodes_orgId: many(referralCodes, {
		relationName: "referralCodes_orgId_organizations_id"
	}),
	personalizedMessages: many(personalizedMessages),
	workflowRules_organizationId: many(workflowRules, {
		relationName: "workflowRules_organizationId_organizations_id"
	}),
	workflowRules_orgId: many(workflowRules, {
		relationName: "workflowRules_orgId_organizations_id"
	}),
	products: many(products),
	profile: one(profiles, {
		fields: [organizations.ownerUserId],
		references: [profiles.id],
		relationName: "organizations_ownerUserId_profiles_id"
	}),
}));

export const teamMembersRelations = relations(teamMembers, ({one, many}) => ({
	profile_userId: one(profiles, {
		fields: [teamMembers.userId],
		references: [profiles.id],
		relationName: "teamMembers_userId_profiles_id"
	}),
	organization: one(organizations, {
		fields: [teamMembers.organizationId],
		references: [organizations.id]
	}),
	profile_ownerUserId: one(profiles, {
		fields: [teamMembers.ownerUserId],
		references: [profiles.id],
		relationName: "teamMembers_ownerUserId_profiles_id"
	}),
	teamSessions: many(teamSessions),
}));

export const teamSessionsRelations = relations(teamSessions, ({one}) => ({
	teamMember: one(teamMembers, {
		fields: [teamSessions.teamMemberId],
		references: [teamMembers.id]
	}),
}));

export const whatsappConnectionsRelations = relations(whatsappConnections, ({one}) => ({
	profile: one(profiles, {
		fields: [whatsappConnections.userId],
		references: [profiles.id]
	}),
	organization: one(organizations, {
		fields: [whatsappConnections.organizationId],
		references: [organizations.id]
	}),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({one}) => ({
	profile: one(profiles, {
		fields: [inventoryMovements.userId],
		references: [profiles.id]
	}),
	organization: one(organizations, {
		fields: [inventoryMovements.organizationId],
		references: [organizations.id]
	}),
	productVariant: one(productVariants, {
		fields: [inventoryMovements.variantId],
		references: [productVariants.id]
	}),
	order: one(orders, {
		fields: [inventoryMovements.orderId],
		references: [orders.id]
	}),
	supplierOrder: one(supplierOrders, {
		fields: [inventoryMovements.supplierOrderId],
		references: [supplierOrders.id]
	}),
}));

export const supplierOrdersRelations = relations(supplierOrders, ({one, many}) => ({
	inventoryMovements: many(inventoryMovements),
	orders: many(orders, {
		relationName: "orders_supplierOrderId_supplierOrders_id"
	}),
	profile: one(profiles, {
		fields: [supplierOrders.userId],
		references: [profiles.id]
	}),
	organization_organizationId: one(organizations, {
		fields: [supplierOrders.organizationId],
		references: [organizations.id],
		relationName: "supplierOrders_organizationId_organizations_id"
	}),
	supplier: one(suppliers, {
		fields: [supplierOrders.supplierId],
		references: [suppliers.id]
	}),
	order: one(orders, {
		fields: [supplierOrders.orderId],
		references: [orders.id],
		relationName: "supplierOrders_orderId_orders_id"
	}),
	organization_orgId: one(organizations, {
		fields: [supplierOrders.orgId],
		references: [organizations.id],
		relationName: "supplierOrders_orgId_organizations_id"
	}),
	whatsappMessages: many(whatsappMessages),
}));

export const supplierProductAvailabilityRelations = relations(supplierProductAvailability, ({one}) => ({
	profile: one(profiles, {
		fields: [supplierProductAvailability.userId],
		references: [profiles.id]
	}),
	supplier: one(suppliers, {
		fields: [supplierProductAvailability.supplierId],
		references: [suppliers.id]
	}),
}));

export const suppliersRelations = relations(suppliers, ({one, many}) => ({
	supplierProductAvailabilities: many(supplierProductAvailability),
	profile: one(profiles, {
		fields: [suppliers.userId],
		references: [profiles.id]
	}),
	organization_organizationId: one(organizations, {
		fields: [suppliers.organizationId],
		references: [organizations.id],
		relationName: "suppliers_organizationId_organizations_id"
	}),
	organization_orgId: one(organizations, {
		fields: [suppliers.orgId],
		references: [organizations.id],
		relationName: "suppliers_orgId_organizations_id"
	}),
	supplierBrandRules: many(supplierBrandRules),
	supplierOrders: many(supplierOrders),
	whatsappMessages: many(whatsappMessages),
	products: many(products),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	orders: many(orders),
	profile: one(profiles, {
		fields: [products.userId],
		references: [profiles.id]
	}),
	supplier: one(suppliers, {
		fields: [products.preferredSupplierId],
		references: [suppliers.id]
	}),
	organization: one(organizations, {
		fields: [products.orgId],
		references: [organizations.id]
	}),
	productVariants: many(productVariants),
}));

export const customersRelations = relations(customers, ({one, many}) => ({
	orders: many(orders),
	profile: one(profiles, {
		fields: [customers.userId],
		references: [profiles.id]
	}),
	organization_organizationId: one(organizations, {
		fields: [customers.organizationId],
		references: [organizations.id],
		relationName: "customers_organizationId_organizations_id"
	}),
	organization_orgId: one(organizations, {
		fields: [customers.orgId],
		references: [organizations.id],
		relationName: "customers_orgId_organizations_id"
	}),
	referralCodes: many(referralCodes),
	personalizedMessages: many(personalizedMessages),
}));

export const workflowConfigRelations = relations(workflowConfig, ({one}) => ({
	profile: one(profiles, {
		fields: [workflowConfig.userId],
		references: [profiles.id]
	}),
	organization_organizationId: one(organizations, {
		fields: [workflowConfig.organizationId],
		references: [organizations.id],
		relationName: "workflowConfig_organizationId_organizations_id"
	}),
	organization_orgId: one(organizations, {
		fields: [workflowConfig.orgId],
		references: [organizations.id],
		relationName: "workflowConfig_orgId_organizations_id"
	}),
}));

export const supplierBrandRulesRelations = relations(supplierBrandRules, ({one}) => ({
	profile: one(profiles, {
		fields: [supplierBrandRules.userId],
		references: [profiles.id]
	}),
	supplier: one(suppliers, {
		fields: [supplierBrandRules.supplierId],
		references: [suppliers.id]
	}),
	organization: one(organizations, {
		fields: [supplierBrandRules.orgId],
		references: [organizations.id]
	}),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({one}) => ({
	profile: one(profiles, {
		fields: [messageTemplates.userId],
		references: [profiles.id]
	}),
	organization_organizationId: one(organizations, {
		fields: [messageTemplates.organizationId],
		references: [organizations.id],
		relationName: "messageTemplates_organizationId_organizations_id"
	}),
	organization_orgId: one(organizations, {
		fields: [messageTemplates.orgId],
		references: [organizations.id],
		relationName: "messageTemplates_orgId_organizations_id"
	}),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({one}) => ({
	profile: one(profiles, {
		fields: [whatsappMessages.userId],
		references: [profiles.id]
	}),
	organization_organizationId: one(organizations, {
		fields: [whatsappMessages.organizationId],
		references: [organizations.id],
		relationName: "whatsappMessages_organizationId_organizations_id"
	}),
	supplierOrder: one(supplierOrders, {
		fields: [whatsappMessages.supplierOrderId],
		references: [supplierOrders.id]
	}),
	supplier: one(suppliers, {
		fields: [whatsappMessages.supplierId],
		references: [suppliers.id]
	}),
	organization_orgId: one(organizations, {
		fields: [whatsappMessages.orgId],
		references: [organizations.id],
		relationName: "whatsappMessages_orgId_organizations_id"
	}),
}));

export const customerMatchRulesRelations = relations(customerMatchRules, ({one}) => ({
	profile: one(profiles, {
		fields: [customerMatchRules.userId],
		references: [profiles.id]
	}),
	organization: one(organizations, {
		fields: [customerMatchRules.orgId],
		references: [organizations.id]
	}),
}));

export const referralCodesRelations = relations(referralCodes, ({one}) => ({
	profile: one(profiles, {
		fields: [referralCodes.userId],
		references: [profiles.id]
	}),
	organization_organizationId: one(organizations, {
		fields: [referralCodes.organizationId],
		references: [organizations.id],
		relationName: "referralCodes_organizationId_organizations_id"
	}),
	customer: one(customers, {
		fields: [referralCodes.customerId],
		references: [customers.id]
	}),
	organization_orgId: one(organizations, {
		fields: [referralCodes.orgId],
		references: [organizations.id],
		relationName: "referralCodes_orgId_organizations_id"
	}),
}));

export const personalizedMessagesRelations = relations(personalizedMessages, ({one}) => ({
	profile: one(profiles, {
		fields: [personalizedMessages.userId],
		references: [profiles.id]
	}),
	order: one(orders, {
		fields: [personalizedMessages.orderId],
		references: [orders.id]
	}),
	customer: one(customers, {
		fields: [personalizedMessages.customerId],
		references: [customers.id]
	}),
	organization: one(organizations, {
		fields: [personalizedMessages.orgId],
		references: [organizations.id]
	}),
}));

export const workflowRulesRelations = relations(workflowRules, ({one}) => ({
	organization_organizationId: one(organizations, {
		fields: [workflowRules.organizationId],
		references: [organizations.id],
		relationName: "workflowRules_organizationId_organizations_id"
	}),
	profile: one(profiles, {
		fields: [workflowRules.userId],
		references: [profiles.id]
	}),
	organization_orgId: one(organizations, {
		fields: [workflowRules.orgId],
		references: [organizations.id],
		relationName: "workflowRules_orgId_organizations_id"
	}),
}));