<?php

namespace Tests\Unit;

use App\Clients\CartServiceClient;
use App\Exceptions\ServiceCommunicationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CartServiceClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['services.cart.url' => 'http://cart.test/']);
    }

    public function test_get_cart_returns_contract_items_and_uses_the_configured_service_url(): void
    {
        Http::fake([
            'cart.test/carts/7' => Http::response([
                'data' => [
                    'user_id' => 7,
                    'items' => [
                        ['product_id' => 11, 'quantity' => 2, 'id' => 3],
                    ],
                    'total_quantity' => 2,
                ],
            ]),
        ]);

        $cart = (new CartServiceClient)->getCart(7);

        $this->assertSame([
            'user_id' => 7,
            'items' => [
                ['product_id' => 11, 'quantity' => 2],
            ],
        ], $cart);

        Http::assertSent(fn (Request $request): bool => $request->method() === 'GET'
            && $request->url() === 'http://cart.test/carts/7');
    }

    public function test_clear_cart_uses_delete_and_returns_the_deleted_item_count(): void
    {
        Http::fake([
            'cart.test/carts/7' => Http::response(['data' => ['deleted_items' => 2]]),
        ]);

        $this->assertSame(2, (new CartServiceClient)->clearCart(7));

        Http::assertSent(fn (Request $request): bool => $request->method() === 'DELETE'
            && $request->url() === 'http://cart.test/carts/7');
    }

    public function test_connection_failures_become_service_unavailable_exceptions(): void
    {
        Http::fake(fn () => throw new ConnectionException('Connection timed out'));

        try {
            (new CartServiceClient)->getCart(7);
            $this->fail('Expected Cart Service communication failure.');
        } catch (ServiceCommunicationException $exception) {
            $this->assertSame(503, $exception->httpStatus);
            $this->assertInstanceOf(ConnectionException::class, $exception->getPrevious());
        }
    }

    public function test_http_timeouts_are_capped_at_five_seconds(): void
    {
        $timeout = (new \ReflectionClass(CartServiceClient::class))
            ->getReflectionConstant('TIMEOUT_SECONDS')
            ->getValue();

        $this->assertSame(5, $timeout);
    }

    public function test_http_errors_invalid_json_and_invalid_cart_data_are_rejected(): void
    {
        Http::fake(['cart.test/carts/7' => Http::response([], 500)]);
        $this->assertUnavailable(fn () => (new CartServiceClient)->getCart(7));

        Http::fake(['cart.test/carts/7' => Http::response('not-json', 200)]);
        $this->assertUnavailable(fn () => (new CartServiceClient)->getCart(7));

        Http::fake(['cart.test/carts/7' => Http::response(['data' => ['items' => [['product_id' => 11]]]])]);
        $this->assertUnavailable(fn () => (new CartServiceClient)->getCart(7));

        Http::fake(['cart.test/carts/7' => Http::response(['data' => ['deleted_items' => '2']])]);
        $this->assertUnavailable(fn () => (new CartServiceClient)->clearCart(7));
    }

    private function assertUnavailable(callable $callback): void
    {
        try {
            $callback();
            $this->fail('Expected a service communication failure.');
        } catch (ServiceCommunicationException $exception) {
            $this->assertSame(503, $exception->httpStatus);
        }
    }
}
