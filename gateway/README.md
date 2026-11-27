# API Gateway

Gateway runs on port `8080` and proxies requests to the microservices:

| Gateway path | Upstream path | Service |
| --- | --- | --- |
| `/catalog` | `/products` | Product |
| `/products` | `/products` | Product |
| `/carts` | `/carts` | Cart |
| `/reviews` | `/reviews` | Review |
| `/orders` | `/api/v1/orders` | Order |

Run the gateway and its services from the repository root:

```powershell
docker compose up --build gateway
```

Compose starts the order service on port `3003` and the gateway on port `8080`.
The gateway is available at `http://localhost:8080`; for example,
`GET /catalog` returns the product list and `GET /orders` reaches the order
service.

Upstream URLs can be configured with `PRODUCT_URL`, `CART_URL`, `REVIEW_URL`,
and `ORDER_URL`. The older `*_SERVICE_URL` names are also accepted.
