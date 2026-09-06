#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:5080}"
: "${DEMO_PASSWORD:?DEMO_PASSWORD is required}"

login() {
  local email="$1"
  curl -fsS -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${DEMO_PASSWORD}\"}" \
    "${API_BASE}/api/v1/auth/login"
}

auth_header() {
  local token="$1"
  printf 'Authorization: Bearer %s' "$token"
}

printf 'Waiting for API readiness...\n'
for attempt in $(seq 1 90); do
  if curl -fsS "${API_BASE}/health/ready" >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" -eq 90 ]]; then
    echo 'API did not become ready.' >&2
    exit 1
  fi
  sleep 2
done

curl -fsS "${API_BASE}/health/live" >/dev/null
curl -fsS "${API_BASE}/health/ready" >/dev/null
api_metadata="$(curl -fsS "${API_BASE}/api")"
jq -e '.version == "1.0.1"' <<<"$api_metadata" >/dev/null

customer_session="$(login 'customer@accessiux.local')"
seller_session="$(login 'seller@accessiux.local')"
admin_session="$(login 'admin@accessiux.local')"

customer_token="$(jq -r '.accessToken' <<<"$customer_session")"
seller_token="$(jq -r '.accessToken' <<<"$seller_session")"
admin_token="$(jq -r '.accessToken' <<<"$admin_session")"

jq -e '.user.roles | index("Customer") != null' <<<"$customer_session" >/dev/null
jq -e '.user.roles | index("Seller") != null' <<<"$seller_session" >/dev/null
jq -e '.user.roles | index("Administrator") != null' <<<"$admin_session" >/dev/null
curl -fsS -H "$(auth_header "$admin_token")" "${API_BASE}/api/v1/auth/me" | jq -e '.roles | index("Administrator") != null' >/dev/null

categories="$(curl -fsS "${API_BASE}/api/v1/catalog/categories")"
category_id="$(jq -r '.[0].id' <<<"$categories")"
test -n "$category_id"

seller_payload='{"displayName":"Smoke Seller","slug":"smoke-seller","description":"Perfil creado por la validación full-stack."}'
seller_profile="$(curl -fsS -H "$(auth_header "$seller_token")" -H 'Content-Type: application/json' -d "$seller_payload" "${API_BASE}/api/v1/catalog/seller")"
seller_id="$(jq -r '.id' <<<"$seller_profile")"
test -n "$seller_id"

policies_payload='{"warrantyPolicy":"Garantía de 12 meses para la validación smoke.","shippingPolicy":"Envío nacional de prueba con seguimiento.","returnPolicy":"Devoluciones aceptadas dentro de 30 días para la prueba."}'
updated_seller="$(curl -fsS -X PUT -H "$(auth_header "$seller_token")" -H 'Content-Type: application/json' -d "$policies_payload" "${API_BASE}/api/v1/catalog/seller/policies")"
jq -e '.warrantyPolicy != null and .shippingPolicy != null and .returnPolicy != null' <<<"$updated_seller" >/dev/null

product_payload="$(jq -nc --arg categoryId "$category_id" '{categoryId:$categoryId,name:"Producto Smoke v1",slug:"smoke-product-v1",description:"Producto creado para validar el flujo completo de AccessiUX Market.",price:1500.00,currency:"DOP",stockQuantity:5}')"
product="$(curl -fsS -H "$(auth_header "$seller_token")" -H 'Content-Type: application/json' -d "$product_payload" "${API_BASE}/api/v1/catalog/seller/products")"
product_id="$(jq -r '.id' <<<"$product")"
test -n "$product_id"
curl -fsS -X POST -H "$(auth_header "$seller_token")" "${API_BASE}/api/v1/catalog/seller/products/${product_id}/publish" >/dev/null

public_product="$(curl -fsS "${API_BASE}/api/v1/catalog/products/smoke-product-v1")"
jq -e '.status == "Published" and .stockQuantity == 5' <<<"$public_product" >/dev/null
public_seller="$(curl -fsS "${API_BASE}/api/v1/catalog/sellers/id/${seller_id}")"
jq -e '.warrantyPolicy != null and .shippingPolicy != null and .returnPolicy != null' <<<"$public_seller" >/dev/null

cart_payload="$(jq -nc --arg productId "$product_id" '{productId:$productId,quantity:2}')"
cart="$(curl -fsS -H "$(auth_header "$customer_token")" -H 'Content-Type: application/json' -d "$cart_payload" "${API_BASE}/api/v1/cart/items")"
jq -e '.totalQuantity == 2 and .items[0].quantity == 2' <<<"$cart" >/dev/null

checkout_payload='{"address":{"recipientName":"Cliente Demo","addressLine1":"Av. Winston Churchill 1","addressLine2":null,"city":"Santo Domingo","region":"Distrito Nacional","postalCode":"10127","countryCode":"DO","phone":"8095550101"},"paymentMethod":"CashOnDelivery"}'
review="$(curl -fsS -H "$(auth_header "$customer_token")" -H 'Content-Type: application/json' -d "$checkout_payload" "${API_BASE}/api/v1/checkout/review")"
jq -e '.canConfirm == true and .items[0].quantity == 2 and .total > 0' <<<"$review" >/dev/null

confirmation="$(curl -fsS -H "$(auth_header "$customer_token")" -H 'Content-Type: application/json' -d "$checkout_payload" "${API_BASE}/api/v1/checkout/confirm")"
order_id="$(jq -r '.orderId' <<<"$confirmation")"
jq -e '.status == "Pending"' <<<"$confirmation" >/dev/null

curl -fsS "${API_BASE}/api/v1/catalog/products/smoke-product-v1" | jq -e '.stockQuantity == 3' >/dev/null
orders="$(curl -fsS -H "$(auth_header "$customer_token")" "${API_BASE}/api/v1/orders/")"
jq -e --arg orderId "$order_id" 'map(select(.id == $orderId)) | length == 1' <<<"$orders" >/dev/null
order_detail="$(curl -fsS -H "$(auth_header "$customer_token")" "${API_BASE}/api/v1/orders/${order_id}")"
jq -e '.canCancel == true and .status == "Pending"' <<<"$order_detail" >/dev/null

cancelled="$(curl -fsS -X POST -H "$(auth_header "$customer_token")" "${API_BASE}/api/v1/orders/${order_id}/cancel")"
jq -e '.status == "Cancelled"' <<<"$cancelled" >/dev/null
curl -fsS "${API_BASE}/api/v1/catalog/products/smoke-product-v1" | jq -e '.stockQuantity == 5' >/dev/null
curl -fsS -H "$(auth_header "$customer_token")" "${API_BASE}/api/v1/cart" | jq -e '.totalQuantity == 0 and (.items | length) == 0' >/dev/null

printf 'FULL-STACK API SMOKE: PASS\n'
printf 'Validated health, v1.0.1 metadata, three demo roles, seller policies, product publication, cart, checkout, orders, cancellation and stock restoration.\n'
