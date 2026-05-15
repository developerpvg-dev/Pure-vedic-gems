import { createAdminClient } from '@/lib/supabase/admin';
import { createInAppNotifications } from '@/lib/notifications/in-app';
import type { Cart, CartItem } from '@/lib/types/cart';
import type { CartItemInput } from '@/lib/validators/cart';
import type { Json, Product, ServerCart, ServerCartItem } from '@/lib/types/database';

const PRODUCT_SELECT = `
  id, sku, slug, tag_number, name, category, price, carat_weight, origin, images,
  thumbnail_url, in_stock, stock_quantity, stock_status, availability_status,
  is_active, sold_individually, backorders_allowed, reserved_until,
  reserved_by_customer_id
`;

const HIGH_VALUE_CART_THRESHOLD = 100000;

type CartProduct = Pick<
  Product,
  | 'id'
  | 'sku'
  | 'slug'
  | 'tag_number'
  | 'name'
  | 'category'
  | 'price'
  | 'carat_weight'
  | 'origin'
  | 'images'
  | 'thumbnail_url'
  | 'in_stock'
  | 'stock_quantity'
  | 'stock_status'
  | 'availability_status'
  | 'is_active'
  | 'sold_individually'
  | 'backorders_allowed'
  | 'reserved_until'
  | 'reserved_by_customer_id'
>;

function cartFromItems(items: CartItem[]): Cart {
  return {
    items,
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function getImageUrl(product: CartProduct | undefined, fallback: string | null) {
  if (product?.thumbnail_url) return product.thumbnail_url;
  const images = product?.images;
  if (Array.isArray(images) && typeof images[0] === 'string') return images[0];
  return fallback ?? '/placeholder-gem.png';
}

function metadataString(metadata: Json, key: string) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  const value = metadata[key];
  return typeof value === 'string' ? value : undefined;
}

function metadataNumber(metadata: Json, key: string) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  const value = metadata[key];
  return typeof value === 'number' ? value : undefined;
}

function metadataValue(metadata: Json, key: string) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return undefined;
  return metadata[key];
}

function isReservedForAnotherCustomer(product: CartProduct, customerId: string) {
  if (!product.reserved_until) return false;
  const expires = new Date(product.reserved_until).getTime();
  if (Number.isNaN(expires) || expires <= Date.now()) return false;
  return product.reserved_by_customer_id !== customerId;
}

function assertProductCanBeAdded(product: CartProduct, customerId: string) {
  if (!product.is_active) {
    throw new Error('This product is not available for purchase.');
  }
  if (!product.in_stock || product.stock_status === 'out_of_stock') {
    throw new Error(`Product "${product.name}" is currently out of stock.`);
  }
  if (['sold', 'archived', 'out_of_stock'].includes(product.availability_status)) {
    throw new Error(`Product "${product.name}" is not available for purchase.`);
  }
  if (product.availability_status === 'reserved' && isReservedForAnotherCustomer(product, customerId)) {
    throw new Error(`Product "${product.name}" is currently reserved.`);
  }
}

function getAvailableQuantity(product: CartProduct) {
  const stockQuantity = Math.max(0, Number(product.stock_quantity ?? 0));
  return product.sold_individually ? Math.min(1, stockQuantity) : stockQuantity;
}

function assertRequestedQuantityInStock(product: CartProduct, requestedQuantity: number) {
  const availableQuantity = getAvailableQuantity(product);
  if (availableQuantity <= 0) {
    throw new Error(`Product "${product.name}" is currently out of stock.`);
  }
  if (requestedQuantity > availableQuantity) {
    throw new Error(`Only ${availableQuantity} unit(s) of "${product.name}" are available.`);
  }
}

export function deriveCartLineKey(item: Pick<CartItemInput, 'product_id' | 'configuration_id' | 'key'>) {
  if (item.key) return item.key;
  return item.configuration_id ? `${item.product_id}:cfg:${item.configuration_id}` : item.product_id;
}

export async function getOrCreateCustomerCart(customerId: string, guestSessionId?: string) {
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from('carts')
    .select('*')
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .maybeSingle();

  if (fetchError) {
    throw new Error('Failed to fetch cart.');
  }
  if (existing) return existing as ServerCart;

  const { data: created, error: insertError } = await supabase
    .from('carts')
    .insert({
      customer_id: customerId,
      guest_session_id: guestSessionId ?? null,
      status: 'active',
      metadata: {},
    })
    .select('*')
    .single();

  if (insertError || !created) {
    const { data: racedCart } = await supabase
      .from('carts')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .single();
    if (racedCart) return racedCart as ServerCart;
    throw new Error('Failed to create cart.');
  }

  return created as ServerCart;
}

export async function getCustomerCart(customerId: string) {
  const cart = await getOrCreateCustomerCart(customerId);
  return getCartResponse(cart.id);
}

export async function getCartResponse(cartId: string): Promise<Cart> {
  const supabase = createAdminClient();
  const { data: rawItems, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Failed to fetch cart items.');
  const rows = (rawItems ?? []) as ServerCartItem[];
  const productIds = [...new Set(rows.map((item) => item.product_id))];

  let productMap = new Map<string, CartProduct>();
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .in('id', productIds);
    productMap = new Map((products as CartProduct[] | null ?? []).map((product) => [product.id, product]));
  }

  const items = rows
    .map((row): CartItem | null => {
      const product = productMap.get(row.product_id);
      if (product && (!product.is_active || product.availability_status === 'archived')) {
        return null;
      }

      return {
        key: row.line_key,
        product_id: row.product_id,
        slug: product?.slug ?? metadataString(row.metadata, 'slug'),
        sku: product?.sku ?? row.sku ?? '',
        tag_number: product?.tag_number ?? row.tag_number ?? null,
        name: product?.name ?? row.name_snapshot,
        category: product?.category ?? row.category_snapshot ?? 'gemstone',
        image_url: getImageUrl(product, row.image_url_snapshot),
        price: Number(row.configuration_id ? row.price_snapshot : product?.price ?? row.price_snapshot ?? 0),
        quantity: row.quantity,
        stock_quantity: product?.stock_quantity ?? null,
        stock_status: product?.stock_status ?? null,
        availability_status: product?.availability_status ?? null,
        in_stock: product?.in_stock ?? null,
        sold_individually: product?.sold_individually ?? null,
        carat_weight: product?.carat_weight ?? metadataNumber(row.metadata, 'carat_weight') ?? null,
        origin: product?.origin ?? metadataString(row.metadata, 'origin') ?? null,
        configuration_id: row.configuration_id ?? undefined,
        configuration_summary: metadataString(row.metadata, 'configuration_summary'),
        configuration_snapshot: metadataValue(row.metadata, 'configuration_snapshot'),
        configuration_edit_url: metadataString(row.metadata, 'configuration_edit_url'),
        delivery_eta_label: metadataString(row.metadata, 'delivery_eta_label'),
      };
    })
    .filter((item): item is CartItem => item !== null);

  const cart = cartFromItems(items);
  await supabase
    .from('carts')
    .update({
      item_count: cart.item_count,
      subtotal: cart.subtotal,
      last_event_at: new Date().toISOString(),
    })
    .eq('id', cartId)
    .then(null, () => undefined);

  return cart;
}

export async function upsertCustomerCartItem(
  customerId: string,
  input: CartItemInput,
  guestSessionId?: string,
  options: { notify?: boolean; capToStock?: boolean } = {}
) {
  const supabase = createAdminClient();
  const cart = await getOrCreateCustomerCart(customerId, guestSessionId);
  const lineKey = deriveCartLineKey(input);

  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', input.product_id)
    .single();

  if (productError || !productData) {
    throw new Error('Product not found.');
  }

  const product = productData as CartProduct;
  assertProductCanBeAdded(product, customerId);

  let verifiedUnitPrice = Number(product.price);
  let configurationSnapshot = input.configuration_snapshot;
  let deliveryEtaLabel = input.delivery_eta_label ?? null;
  let configurationEditUrl = input.configuration_edit_url ?? null;

  if (input.configuration_id) {
    const { data: configuration, error: configurationError } = await supabase
      .from('product_configurations')
      .select('id, product_id, total_price, configuration_snapshot, delivery_eta_label')
      .eq('id', input.configuration_id)
      .single();

    if (configurationError || !configuration || configuration.product_id !== input.product_id) {
      throw new Error('Configuration could not be verified. Please rebuild it from the configurator.');
    }

    verifiedUnitPrice = Number(configuration.total_price ?? product.price);
    configurationSnapshot = configuration.configuration_snapshot ?? configurationSnapshot;
    deliveryEtaLabel = configuration.delivery_eta_label ?? deliveryEtaLabel;
    configurationEditUrl = configurationEditUrl ?? `/configure/${input.product_id}`;
  }

  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('line_key', lineKey)
    .maybeSingle();
  const existingItem = existing as ServerCartItem | null;

  const previousQuantity = existingItem?.quantity ?? 0;
  const requestedQuantity = previousQuantity + input.quantity;
  const quantity = options.capToStock
    ? Math.min(requestedQuantity, getAvailableQuantity(product))
    : requestedQuantity;

  assertRequestedQuantityInStock(product, quantity);
  if (quantity <= previousQuantity) {
    return getCartResponse(cart.id);
  }

  const metadata = {
    carat_weight: input.carat_weight ?? product.carat_weight ?? null,
    slug: product.slug,
    origin: input.origin ?? product.origin ?? null,
    configuration_summary: input.configuration_summary ?? null,
    configuration_snapshot: configurationSnapshot ?? null,
    configuration_edit_url: configurationEditUrl,
    delivery_eta_label: deliveryEtaLabel,
  };

  if (existingItem) {
    const { error } = await supabase
      .from('cart_items')
      .update({
        quantity,
        sku: product.sku,
        tag_number: product.tag_number,
        name_snapshot: product.name,
        category_snapshot: product.category,
        image_url_snapshot: getImageUrl(product, input.image_url),
        price_snapshot: verifiedUnitPrice,
        line_total_snapshot: verifiedUnitPrice * quantity,
        metadata: metadata as Json,
      })
      .eq('id', existingItem.id);
    if (error) throw new Error('Failed to update cart item.');
  } else {
    const { error } = await supabase.from('cart_items').insert({
      cart_id: cart.id,
      line_key: lineKey,
      product_id: input.product_id,
      configuration_id: input.configuration_id ?? null,
      quantity,
      sku: product.sku,
      tag_number: product.tag_number,
      name_snapshot: product.name,
      category_snapshot: product.category,
      image_url_snapshot: getImageUrl(product, input.image_url),
      price_snapshot: verifiedUnitPrice,
      line_total_snapshot: verifiedUnitPrice * quantity,
      metadata: metadata as Json,
    });
    if (error) throw new Error('Failed to add item to cart.');
  }

  await logCartEvent({
    customerId,
    guestSessionId,
    cartId: cart.id,
    productId: input.product_id,
    eventType: existingItem ? 'cart_item_updated' : 'cart_item_added',
    quantity,
    value: verifiedUnitPrice * quantity,
    metadata: {
      notify: options.notify !== false,
      previous_quantity: previousQuantity,
      added_quantity: quantity - previousQuantity,
    },
  });

  return getCartResponse(cart.id);
}

export async function updateCustomerCartItem(customerId: string, lineKey: string, quantity: number) {
  const supabase = createAdminClient();
  const cart = await getOrCreateCustomerCart(customerId);

  if (quantity <= 0) {
    return removeCustomerCartItem(customerId, lineKey);
  }

  const { data: existing, error: fetchError } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('line_key', lineKey)
    .single();

  if (fetchError || !existing) throw new Error('Cart item not found.');
  const existingItem = existing as ServerCartItem;

  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', existingItem.product_id)
    .single();

  if (productError || !productData) throw new Error('Product not found.');
  const product = productData as CartProduct;
  assertProductCanBeAdded(product, customerId);
  assertRequestedQuantityInStock(product, quantity);

  const nextQuantity = quantity;
  const { error } = await supabase
    .from('cart_items')
    .update({
      quantity: nextQuantity,
      line_total_snapshot: Number(existingItem.price_snapshot) * nextQuantity,
    })
    .eq('id', existingItem.id);

  if (error) throw new Error('Failed to update cart item.');

  await logCartEvent({
    customerId,
    cartId: cart.id,
    cartItemId: existingItem.id,
    productId: existingItem.product_id,
    eventType: 'cart_item_updated',
    quantity: nextQuantity,
    value: Number(existingItem.price_snapshot) * nextQuantity,
  });

  return getCartResponse(cart.id);
}

export async function removeCustomerCartItem(customerId: string, lineKey: string) {
  const supabase = createAdminClient();
  const cart = await getOrCreateCustomerCart(customerId);
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id)
    .eq('line_key', lineKey)
    .maybeSingle();
  const existingItem = existing as ServerCartItem | null;

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.id)
    .eq('line_key', lineKey);

  if (error) throw new Error('Failed to remove cart item.');

  await logCartEvent({
    customerId,
    cartId: cart.id,
    cartItemId: existingItem?.id,
    productId: existingItem?.product_id,
    eventType: 'cart_item_removed',
    quantity: existingItem?.quantity,
    value: existingItem ? Number(existingItem.price_snapshot) * existingItem.quantity : undefined,
  });

  return getCartResponse(cart.id);
}

export async function clearCustomerCart(customerId: string) {
  const supabase = createAdminClient();
  const cart = await getOrCreateCustomerCart(customerId);
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cart.id);
  if (error) throw new Error('Failed to clear cart.');
  await supabase
    .from('carts')
    .update({ status: 'cleared', item_count: 0, subtotal: 0 })
    .eq('id', cart.id);
  await logCartEvent({ customerId, cartId: cart.id, eventType: 'cart_cleared', quantity: 0, value: 0 });
  return cartFromItems([]);
}

export async function mergeCustomerCart(customerId: string, items: CartItemInput[], guestSessionId?: string) {
  const cart = await getOrCreateCustomerCart(customerId, guestSessionId);
  for (const item of items) {
    await upsertCustomerCartItem(customerId, item, guestSessionId, { notify: false, capToStock: true }).catch(() => undefined);
  }

  const supabase = createAdminClient();
  await supabase
    .from('carts')
    .update({ guest_session_id: guestSessionId ?? cart.guest_session_id, merged_at: new Date().toISOString() })
    .eq('id', cart.id)
    .then(null, () => undefined);

  await logCartEvent({
    customerId,
    guestSessionId,
    cartId: cart.id,
    eventType: 'cart_merged',
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    value: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  });

  return getCartResponse(cart.id);
}

export async function logCartEvent({
  customerId,
  guestSessionId,
  cartId,
  cartItemId,
  productId,
  eventType,
  quantity,
  value,
  metadata = {},
}: {
  customerId?: string | null;
  guestSessionId?: string | null;
  cartId?: string | null;
  cartItemId?: string | null;
  productId?: string | null;
  eventType: string;
  quantity?: number | null;
  value?: number | null;
  metadata?: Record<string, unknown>;
}) {
  if (!customerId && !guestSessionId) return;
  const supabase = createAdminClient();
  await supabase
    .from('cart_events')
    .insert({
      customer_id: customerId ?? null,
      guest_session_id: guestSessionId ?? null,
      cart_id: cartId ?? null,
      cart_item_id: cartItemId ?? null,
      product_id: productId ?? null,
      event_type: eventType,
      quantity: quantity ?? null,
      value: value ?? null,
      metadata: metadata as Json,
    })
    .then(null, () => undefined);

  if ((value ?? 0) >= HIGH_VALUE_CART_THRESHOLD) {
    await supabase
      .from('notification_log')
      .insert({
        type: 'cart_high_value',
        recipient: process.env.ADMIN_NOTIFICATION_EMAIL ?? 'admin',
        template: 'high_value_cart_activity',
        context: {
          customer_id: customerId ?? null,
          guest_session_id: guestSessionId ?? null,
          cart_id: cartId ?? null,
          event_type: eventType,
          value,
          throttled_window_hours: 24,
        },
        status: 'queued',
      })
      .then(null, () => undefined);
  }

  if (eventType === 'cart_item_added' && metadata.notify !== false) {
    const { data: product } = productId
      ? await supabase.from('products').select('name').eq('id', productId).single()
      : { data: null };
    const itemName = product?.name ?? 'an item';

    await createInAppNotifications([
      {
        audience: 'admin',
        recipientRole: 'sales',
        type: (value ?? 0) >= HIGH_VALUE_CART_THRESHOLD ? 'high_value_cart_add' : 'cart_item_added',
        title: (value ?? 0) >= HIGH_VALUE_CART_THRESHOLD ? 'High-value cart activity' : 'Item added to cart',
        message: `${itemName} was added to a cart${value ? ` worth ₹${Number(value).toLocaleString('en-IN')}` : ''}.`,
        href: '/admin',
        entityType: 'cart',
        entityId: cartId ?? null,
        metadata: { customer_id: customerId ?? null, guest_session_id: guestSessionId ?? null, product_id: productId ?? null, value: value ?? null },
      },
      ...(customerId ? [{
        audience: 'user' as const,
        recipientUserId: customerId,
        type: 'cart_item_added',
        title: 'Added to cart',
        message: `${itemName} is in your cart.`,
        href: '/cart',
        entityType: 'cart',
        entityId: cartId ?? null,
        metadata: { product_id: productId ?? null, value: value ?? null },
      }] : []),
    ]);
  }
}