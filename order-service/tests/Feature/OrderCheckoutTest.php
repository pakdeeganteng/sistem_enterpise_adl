<?php

namespace Tests\Feature;

use App\Clients\ProductServiceClient;
use App\Exceptions\ServiceCommunicationException;
use App\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class OrderCheckoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.cart.url' => 'http://cart.test',
            'services.product.url' => 'http://product.test',
        ]);
    }

    public function test_checkout_saves_order_and_product_snapshots_then_clears_cart(): void
    {
        $this->fakeCheckout(
            [
                ['product_id' => 11, 'quantity' => 2],
                ['product_id' => 12, 'quantity' => 1],
            ],
            [
                11 => $this->product('USB Hub', '450000.00', 4),
                12 => $this->product('Mouse', '100.50', 3),
            ],
        );

        $response = $this->postJson('/orders', ['user_id' => 7]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Pesanan berhasil dibuat')
            ->assertJsonPath('data.user_id', 7)
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.total_amount', 900100.5)
            ->assertJsonPath('data.items.0.product_id', 11)
            ->assertJsonPath('data.items.0.product_name', 'USB Hub')
            ->assertJsonPath('data.items.0.unit_price', 450000)
            ->assertJsonPath('data.items.0.quantity', 2)
            ->assertJsonPath('data.items.0.subtotal', 900000)
            ->assertJsonPath('data.items.1.product_name', 'Mouse')
            ->assertJsonPath('data.items.1.unit_price', 100.5)
            ->assertJsonPath('data.items.1.subtotal', 100.5);

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 2);
        Http::assertSent(fn (Request $request): bool => $request->method() === 'GET'
            && $request->url() === 'http://cart.test/carts/7');
        Http::assertSent(fn (Request $request): bool => $request->method() === 'GET'
            && $request->url() === 'http://product.test/products/11');
        Http::assertSent(fn (Request $request): bool => $request->method() === 'GET'
            && $request->url() === 'http://product.test/products/12');
        Http::assertSent(fn (Request $request): bool => $request->method() === 'DELETE'
            && $request->url() === 'http://cart.test/carts/7');
    }

    public function test_order_price_snapshot_is_unchanged_when_product_price_later_changes(): void
    {
        $currentPrice = '450000.00';
        Http::fake(function (Request $request) use (&$currentPrice) {
            if ($request->url() === 'http://cart.test/carts/7') {
                return $request->method() === 'GET'
                    ? Http::response([
                        'data' => ['user_id' => 7, 'items' => [['product_id' => 11, 'quantity' => 2]]],
                    ])
                    : Http::response(['data' => ['deleted_items' => 1]]);
            }

            if ($request->url() === 'http://product.test/products/11') {
                return Http::response([
                    'data' => [
                        'name' => 'USB Hub',
                        'price' => $currentPrice,
                        'stock' => 4,
                    ],
                ]);
            }

            return Http::response([], 500);
        });

        $checkout = $this->postJson('/orders', ['user_id' => 7])->assertCreated();
        $orderId = $checkout->json('data.id');
        $currentPrice = '500000.00';

        $currentProduct = app(ProductServiceClient::class)->getProduct(11);
        $this->assertSame('500000.00', $currentProduct['price']);

        $this->getJson("/orders/{$orderId}")
            ->assertOk()
            ->assertJsonPath('data.items.0.unit_price', 450000)
            ->assertJsonPath('data.items.0.subtotal', 900000)
            ->assertJsonPath('data.total_amount', 900000);
    }

    public function test_failed_order_item_insert_rolls_back_the_order_transaction(): void
    {
        $this->fakeCheckout(
            [['product_id' => 11, 'quantity' => 1]],
            [11 => $this->product('USB Hub', '450000.00', 4)],
        );
        OrderItem::creating(function (OrderItem $item): void {
            throw new \RuntimeException('Simulated order item insert failure');
        });

        $this->postJson('/orders', ['user_id' => 7])
            ->assertInternalServerError()
            ->assertJsonPath('message', 'Gagal membuat pesanan');

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('order_items', 0);
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'DELETE');
    }

    public function test_invalid_user_id_returns_validation_response_without_calling_services(): void
    {
        Http::fake();

        $this->postJson('/orders', ['user_id' => 0])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors'])
            ->assertJsonValidationErrors(['user_id']);

        Http::assertNothingSent();
    }

    public function test_missing_user_id_returns_validation_response_without_calling_services(): void
    {
        Http::fake();

        $this->postJson('/orders', [])
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['user_id']]);

        Http::assertNothingSent();
    }

    public function test_empty_cart_returns_conflict_without_creating_an_order(): void
    {
        Log::spy();
        $this->fakeCheckout([]);

        $this->postJson('/orders', ['user_id' => 7])
            ->assertConflict()
            ->assertJsonPath('message', 'Keranjang kosong')
            ->assertJsonPath('errors.cart.0', 'Keranjang tidak memiliki item');

        $this->assertDatabaseCount('orders', 0);
        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), '/products/'));
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'DELETE');
        Log::shouldHaveReceived('warning')
            ->with('Checkout rejected because the cart is empty.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'checkout'
                    && $context['user_id'] === 7
                    && $context['service'] === 'Cart Service',
            ))
            ->once();
    }

    public function test_missing_product_returns_conflict_and_does_not_create_an_order(): void
    {
        Log::spy();
        $this->fakeCheckout(
            [['product_id' => 404, 'quantity' => 1]],
            [404 => ['status' => 404, 'body' => ['message' => 'Product tidak ditemukan']]],
        );

        $this->postJson('/orders', ['user_id' => 7])
            ->assertConflict()
            ->assertJsonPath('message', 'Produk di keranjang tidak ditemukan')
            ->assertJsonPath('errors.product_id.0', 404);

        $this->assertDatabaseCount('orders', 0);
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'DELETE');
        Log::shouldHaveReceived('warning')
            ->with('Checkout rejected because a cart product was not found.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'checkout'
                    && $context['user_id'] === 7
                    && $context['product_id'] === 404
                    && $context['service'] === 'Product Service',
            ))
            ->once();
    }

    public function test_insufficient_stock_returns_product_name_requested_quantity_and_available_stock(): void
    {
        Log::spy();
        $this->fakeCheckout(
            [['product_id' => 11, 'quantity' => 5]],
            [11 => $this->product('USB Hub', '450000.00', 3)],
        );

        $this->postJson('/orders', ['user_id' => 7])
            ->assertConflict()
            ->assertJsonPath('message', 'Stok produk tidak mencukupi')
            ->assertJsonPath('errors.stock.product_name', 'USB Hub')
            ->assertJsonPath('errors.stock.requested_quantity', 5)
            ->assertJsonPath('errors.stock.available_stock', 3);

        $this->assertDatabaseCount('orders', 0);
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'DELETE');
        Log::shouldHaveReceived('warning')
            ->with('Checkout rejected because product stock is insufficient.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'checkout'
                    && $context['user_id'] === 7
                    && $context['product_id'] === 11
                    && $context['product_name'] === 'USB Hub'
                    && $context['requested_quantity'] === 5
                    && $context['available_stock'] === 3
                    && $context['service'] === 'Product Service',
            ))
            ->once();
    }

    public function test_cart_service_failure_returns_service_unavailable(): void
    {
        Log::spy();
        Http::fake([
            'cart.test/carts/7' => Http::response(['message' => 'unavailable'], 503),
        ]);

        $this->postJson('/orders', ['user_id' => 7])
            ->assertServiceUnavailable()
            ->assertJsonStructure(['message']);

        $this->assertDatabaseCount('orders', 0);
        Log::shouldHaveReceived('warning')
            ->with('Order checkout could not communicate with a dependent service.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'checkout'
                    && $context['user_id'] === 7
                    && $context['service'] === 'Cart Service'
                    && $context['exception'] === ServiceCommunicationException::class,
            ))
            ->once();
    }

    public function test_unexpected_checkout_errors_return_internal_server_error(): void
    {
        Http::fake([
            'cart.test/carts/7' => Http::response([
                'data' => ['user_id' => 7, 'items' => [['product_id' => 11, 'quantity' => 1]]],
            ]),
        ]);
        $productClient = Mockery::mock(ProductServiceClient::class);
        $productClient->shouldReceive('getProduct')
            ->once()
            ->with(11)
            ->andThrow(new \RuntimeException('Unexpected failure'));
        $this->app->instance(ProductServiceClient::class, $productClient);

        $this->postJson('/orders', ['user_id' => 7])
            ->assertInternalServerError()
            ->assertJsonPath('message', 'Gagal membuat pesanan');

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_product_service_failure_returns_service_unavailable(): void
    {
        Log::spy();
        $this->fakeCheckout(
            [['product_id' => 11, 'quantity' => 1]],
            [11 => ['status' => 503, 'body' => ['message' => 'unavailable']]],
        );

        $this->postJson('/orders', ['user_id' => 7])
            ->assertServiceUnavailable()
            ->assertJsonStructure(['message']);

        $this->assertDatabaseCount('orders', 0);
        Http::assertNotSent(fn (Request $request): bool => $request->method() === 'DELETE');
        Log::shouldHaveReceived('warning')
            ->with('Order checkout could not communicate with a dependent service.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'checkout'
                    && $context['user_id'] === 7
                    && $context['service'] === 'Product Service'
                    && $context['exception'] === ServiceCommunicationException::class,
            ))
            ->once();
    }

    public function test_service_failure_details_are_only_returned_when_debug_is_enabled(): void
    {
        config(['app.debug' => true]);
        Http::fake([
            'cart.test/carts/7' => Http::response(['message' => 'private upstream detail'], 503),
        ]);

        $this->postJson('/orders', ['user_id' => 7])
            ->assertServiceUnavailable()
            ->assertJsonPath('error', 'Unable to communicate with Cart Service: returned HTTP 503')
            ->assertJsonPath('service', 'Cart Service');
    }

    public function test_cart_clear_failure_is_logged_but_saved_order_is_returned(): void
    {
        Log::spy();
        $this->fakeCheckout(
            [['product_id' => 11, 'quantity' => 1]],
            [11 => $this->product('USB Hub', '450000.00', 3)],
            deleteStatus: 503,
        );

        $this->postJson('/orders', ['user_id' => 7])
            ->assertCreated()
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.items.0.product_name', 'USB Hub');

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseCount('order_items', 1);
        Log::shouldHaveReceived('error')
            ->with('Order was saved, but the cart could not be cleared.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'clear_cart_after_checkout'
                    && $context['service'] === 'Cart Service'
                    && $context['order_id'] > 0
                    && $context['user_id'] === 7
                    && $context['exception'] === ServiceCommunicationException::class,
            ))
            ->once();
    }

    /**
     * @param  array<int, array{product_id: int, quantity: int}>  $items
     * @param  array<int, array{status: int, body: array<string, mixed>}>  $products
     */
    private function fakeCheckout(
        array $items,
        array $products = [],
        int $cartStatus = 200,
        int $deleteStatus = 200,
    ): void {
        Http::fake(function (Request $request) use ($items, $products, $cartStatus, $deleteStatus) {
            if ($request->url() === 'http://cart.test/carts/7') {
                if ($request->method() === 'GET') {
                    return Http::response(['data' => ['user_id' => 7, 'items' => $items]], $cartStatus);
                }

                return Http::response(['data' => ['deleted_items' => count($items)]], $deleteStatus);
            }

            if (preg_match('#^http://product\.test/products/(\d+)$#', $request->url(), $matches)) {
                $productId = (int) $matches[1];
                $product = $products[$productId] ?? [
                    'status' => 200,
                    'body' => $this->product('Product '.$productId, '1.00', 100),
                ];

                return Http::response($product['body'], $product['status']);
            }

            return Http::response(['message' => 'Unexpected request'], 500);
        });
    }

    /**
     * @return array{status: int, body: array{data: array{name: string, price: string, stock: int}}}
     */
    private function product(string $name, string $price, int $stock): array
    {
        return [
            'status' => 200,
            'body' => [
                'data' => [
                    'name' => $name,
                    'price' => $price,
                    'stock' => $stock,
                ],
            ],
        ];
    }
}
