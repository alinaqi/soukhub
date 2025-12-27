/**
 * Seed script to create test user and import test data
 * Run with: npx tsx scripts/seed-test-data.ts
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Use service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const TEST_EMAIL = 'ashaheen+soukhub@workhub.ai';
const TEST_PASSWORD = 'SoukHub2024!';
const TEST_DATA_DIR = path.join(process.env.HOME!, 'Documents/AI-Playground/test_data');

// Status mappings
const STATUS_MAP: Record<string, Record<string, string>> = {
  amazon: {
    'Delivered to Buyer': 'delivered',
    'Shipped': 'shipped',
    'Pending': 'pending',
    'Cancelled': 'cancelled',
    'Returned': 'returned',
  },
  cartlow: {
    'Delivered': 'delivered',
    'Shipped': 'shipped',
    'RTO-RTN': 'returned',
    'Cancelled': 'cancelled',
    'Processing': 'processing',
    'Pending': 'pending',
  },
  revibe: {
    'Order created': 'pending',
    'Confirmed': 'confirmed',
    'Shipped': 'shipped',
    'Delivered': 'delivered',
    'Cancelled': 'cancelled',
    'Returned': 'returned',
  },
};

function normalizeStatus(status: string, marketplace: string): string {
  const map = STATUS_MAP[marketplace] || {};
  for (const [key, value] of Object.entries(map)) {
    if (status.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  // Check for common patterns
  if (status.toLowerCase().includes('deliver')) return 'delivered';
  if (status.toLowerCase().includes('ship')) return 'shipped';
  if (status.toLowerCase().includes('cancel')) return 'cancelled';
  if (status.toLowerCase().includes('return') || status.toLowerCase().includes('rto')) return 'returned';
  if (status.toLowerCase().includes('creat') || status.toLowerCase().includes('pending')) return 'pending';
  return 'pending';
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try various formats
  const formats = [
    // ISO format
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
    // MM/DD/YYYY HH:MM AM/PM
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  ];

  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  } catch {
    // Continue to other formats
  }

  return null;
}

function parseCSV(content: string, delimiter = ','): Record<string, string>[] {
  // Remove BOM if present
  content = content.replace(/^\uFEFF/, '');

  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0], delimiter);

  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const row: Record<string, string> = {};
    headers.forEach((header, j) => {
      row[header] = values[j] || '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

async function createTestUser(): Promise<string> {
  console.log('Creating test user...');

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === TEST_EMAIL);

  if (existingUser) {
    console.log('User already exists:', existingUser.id);
    return existingUser.id;
  }

  // Create new user
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: 'Ali Shaheen',
    },
  });

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  console.log('User created:', data.user.id);
  return data.user.id;
}

async function setupProfile(userId: string): Promise<void> {
  console.log('Setting up profile...');

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: TEST_EMAIL,
      full_name: 'Ali Shaheen',
      business_name: 'Shaheen Electronics',
      phone: '+971501234567',
      country: 'AE',
      currency: 'AED',
      onboarding_completed: true,
      onboarding_step: 3,
    });

  if (error) {
    console.error('Profile error:', error);
  }
}

async function setupMarketplaceConnections(userId: string): Promise<Record<string, string>> {
  console.log('Setting up marketplace connections...');

  const marketplaces = ['amazon', 'cartlow', 'revibe'];
  const connectionIds: Record<string, string> = {};

  for (const marketplace of marketplaces) {
    const { data, error } = await supabase
      .from('marketplace_connections')
      .upsert({
        user_id: userId,
        marketplace,
        display_name: marketplace.charAt(0).toUpperCase() + marketplace.slice(1),
        status: 'active',
      }, { onConflict: 'user_id,marketplace' })
      .select('id')
      .single();

    if (error) {
      console.error(`Connection error for ${marketplace}:`, error);
    } else if (data) {
      connectionIds[marketplace] = data.id;
    }
  }

  return connectionIds;
}

async function importAmazonData(userId: string, connectionId: string): Promise<number> {
  console.log('Importing Amazon data...');

  const content = fs.readFileSync(path.join(TEST_DATA_DIR, 'amazon.txt'), 'utf-8');
  const rows = parseCSV(content, '\t');

  let imported = 0;
  const seenOrders = new Set<string>();

  for (const row of rows) {
    const orderId = row['order-id'];
    if (!orderId || seenOrders.has(orderId)) continue;
    seenOrders.add(orderId);

    const orderDate = parseDate(row['purchase-date']);
    if (!orderDate) continue;

    const status = normalizeStatus(row['shipment-status'] || 'pending', 'amazon');
    const total = parseFloat(row['item-price'] || '0') || 0;

    const { error } = await supabase.from('orders').upsert({
      user_id: userId,
      connection_id: connectionId,
      marketplace: 'amazon',
      marketplace_order_id: orderId,
      status,
      customer_name: row['buyer-name'] || 'Amazon Customer',
      customer_email: row['buyer-email'] || '',
      shipping_city: row['ship-city'] || '',
      shipping_country: row['ship-country'] || 'AE',
      subtotal: total,
      total: total,
      currency: row['currency'] || 'AED',
      order_date: orderDate.toISOString(),
      fulfillment: row['fulfillment-channel']?.toLowerCase().includes('amazon') ? 'fba' : 'fbm',
    }, { onConflict: 'user_id,marketplace,marketplace_order_id' });

    if (!error) imported++;
  }

  return imported;
}

async function importCartlowData(userId: string, connectionId: string): Promise<number> {
  console.log('Importing Cartlow data...');

  const content = fs.readFileSync(path.join(TEST_DATA_DIR, 'cartlow.csv'), 'utf-8');
  const rows = parseCSV(content, ',');

  let imported = 0;

  for (const row of rows) {
    const orderId = row['id'];
    if (!orderId) continue;

    const orderDate = parseDate(row['OrderDate']);
    if (!orderDate) continue;

    const status = normalizeStatus(row['Status'] || 'pending', 'cartlow');
    const cost = parseFloat(row['Cost'] || '0') || 0;
    const shipping = parseFloat(row['Shipping'] || '0') || 0;
    const tax = parseFloat(row['Tax'] || '0') || 0;
    const discount = parseFloat(row['Discount'] || '0') || 0;

    const { error } = await supabase.from('orders').upsert({
      user_id: userId,
      connection_id: connectionId,
      marketplace: 'cartlow',
      marketplace_order_id: orderId,
      status,
      shipping_city: row['Emirate'] || '',
      shipping_country: 'AE',
      subtotal: cost,
      shipping_cost: shipping,
      tax: tax,
      discount: discount,
      total: cost + shipping + tax - discount,
      currency: row['Currency'] || 'AED',
      order_date: orderDate.toISOString(),
      fulfillment: row['fulfillment']?.toLowerCase().includes('fbc') ? 'fbc' : 'fbm',
    }, { onConflict: 'user_id,marketplace,marketplace_order_id' });

    if (!error) imported++;
  }

  return imported;
}

async function importRevibeData(userId: string, connectionId: string): Promise<number> {
  console.log('Importing Revibe data...');

  const content = fs.readFileSync(path.join(TEST_DATA_DIR, 'revibe.csv'), 'utf-8');
  const rows = parseCSV(content, ',');

  let imported = 0;

  for (const row of rows) {
    const orderId = row['id'];
    if (!orderId) continue;

    const orderDate = parseDate(row['Date']);
    if (!orderDate) continue;

    const shipmentStatus = row['Shipment Status New'] || row['Shipment Status'] || 'pending';
    const status = normalizeStatus(shipmentStatus, 'revibe');
    const cost = parseFloat(row['Actual Cost'] || '0') || 0;
    const cod = parseFloat(row['COD To Collect'] || '0') || 0;

    // Determine payment method
    let paymentMethod = 'card';
    const pm = row['Payment Method']?.toLowerCase() || '';
    if (pm.includes('tabby')) paymentMethod = 'tabby';
    else if (pm.includes('tamara')) paymentMethod = 'tamara';
    else if (pm.includes('cod') || cod > 0) paymentMethod = 'cod';

    const { error } = await supabase.from('orders').upsert({
      user_id: userId,
      connection_id: connectionId,
      marketplace: 'revibe',
      marketplace_order_id: orderId,
      status,
      customer_name: row['Name'] || '',
      customer_email: row['Email'] || '',
      customer_phone: row['Phone Number'] || '',
      shipping_city: row['City'] || '',
      shipping_country: row['Country'] || row['Issuer Country'] || 'AE',
      subtotal: cost,
      total: cost,
      currency: 'AED',
      order_date: orderDate.toISOString(),
      payment_method: paymentMethod,
      tracking_number: row['Tracking ID'] || '',
      carrier: row['Tracking Company'] || '',
    }, { onConflict: 'user_id,marketplace,marketplace_order_id' });

    if (!error) imported++;
  }

  return imported;
}

async function createProducts(userId: string): Promise<void> {
  console.log('Creating products from orders...');

  // Get unique products from order data
  const { data: orders } = await supabase
    .from('orders')
    .select('raw_data, marketplace')
    .eq('user_id', userId);

  // Create some sample products based on common items
  const products = [
    { name: 'iPhone 15 Pro Max', brand: 'Apple', category: 'iPhone', base_price: 4999 },
    { name: 'iPhone 15 Pro', brand: 'Apple', category: 'iPhone', base_price: 4499 },
    { name: 'iPhone 14 Pro Max', brand: 'Apple', category: 'iPhone', base_price: 3999 },
    { name: 'iPhone 14 Pro', brand: 'Apple', category: 'iPhone', base_price: 3499 },
    { name: 'iPhone 13', brand: 'Apple', category: 'iPhone', base_price: 2499 },
    { name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: 'Samsung phone', base_price: 4299 },
    { name: 'Samsung Galaxy S24+', brand: 'Samsung', category: 'Samsung phone', base_price: 3499 },
    { name: 'Samsung Galaxy Note 20', brand: 'Samsung', category: 'Samsung phone', base_price: 1999 },
    { name: 'AirPods Pro 2', brand: 'Apple', category: 'Accessories', base_price: 899 },
    { name: 'MacBook Pro 14"', brand: 'Apple', category: 'MacBook', base_price: 7999 },
  ];

  for (const product of products) {
    await supabase.from('products').upsert({
      user_id: userId,
      ...product,
      is_active: true,
    }, { onConflict: 'user_id,name' }).select();
  }

  console.log(`Created ${products.length} products`);
}

async function main() {
  try {
    console.log('Starting seed process...\n');

    // Create test user
    const userId = await createTestUser();

    // Setup profile
    await setupProfile(userId);

    // Setup marketplace connections
    const connections = await setupMarketplaceConnections(userId);

    // Import data from each marketplace
    const amazonCount = await importAmazonData(userId, connections.amazon);
    console.log(`Imported ${amazonCount} Amazon orders`);

    const cartlowCount = await importCartlowData(userId, connections.cartlow);
    console.log(`Imported ${cartlowCount} Cartlow orders`);

    const revibeCount = await importRevibeData(userId, connections.revibe);
    console.log(`Imported ${revibeCount} Revibe orders`);

    // Create products
    await createProducts(userId);

    console.log('\n========================================');
    console.log('Seed completed successfully!');
    console.log('========================================');
    console.log(`\nTest Account:`);
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    console.log(`\nTotal Orders Imported: ${amazonCount + cartlowCount + revibeCount}`);
    console.log(`- Amazon: ${amazonCount}`);
    console.log(`- Cartlow: ${cartlowCount}`);
    console.log(`- Revibe: ${revibeCount}`);
    console.log('\nLogin at: http://localhost:4000/login');

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

main();
