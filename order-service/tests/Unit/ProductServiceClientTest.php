<?php

namespace Tests\Unit;

use App\Clients\ProductServiceClient;
use App\Exceptions\ProductNotFoundException;
use App\Exceptions\ServiceCommunicationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProductServiceClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['services.product.url' => 'http://product.test/']);
    }

    public function test_get_product_returns_name_price_and_stock_from_the_data_payload(): void
    {
        Http::fake([
            'product.test/products/13' => Http::response([
                'data' => [
                    'name' => 'USB Hub',
                    'price' => '315000.00',
                    'stock' => 18,
                    'id' => 13,
                ],
            ]),
        ]);

        $product = (new ProductServiceClient)->getProduct(13);

        $this->assertSame([
            'name' => 'USB Hub',
            'price' => '315000.00',
            'stock' => 18,
        ], $product);

        Http::assertSent(fn (Request $request): bool => $request->method() === 'GET'
            && $request->url() === 'http://product.test/products/13');
    }

    public function test_product_not_found_is_distinct_from_communication_failure(): void
    {
        Http::fake(['product.test/products/404' => Http::response(['message' => 'not found'], 404)]);

        try {
            (new ProductServiceClient)->getProduct(404);
            $this->fail('Expected product not found.');
        } catch (ProductNotFoundException $exception) {
            $this->assertSame(404, $exception->httpStatus);
        }

        Http::fake(['product.test/products/13' => Http::response(['message' => 'unavailable'], 503)]);
        $this->assertUnavailable(fn () => (new ProductServiceClient)->getProduct(13));
    }

    public function test_connection_failures_and_invalid_product_responses_become_503_exceptions(): void
    {
        Http::fake(fn () => throw new ConnectionException('Connection timed out'));
        $this->assertUnavailable(fn () => (new ProductServiceClient)->getProduct(13));

        Http::fake(['product.test/products/13' => Http::response('not-json', 200)]);
        $this->assertUnavailable(fn () => (new ProductServiceClient)->getProduct(13));

        Http::fake(['product.test/products/13' => Http::response([
            'data' => ['name' => 'USB Hub', 'price' => 'unknown', 'stock' => 18],
        ])]);
        $this->assertUnavailable(fn () => (new ProductServiceClient)->getProduct(13));
    }

    public function test_http_timeouts_are_capped_at_five_seconds(): void
    {
        $timeout = (new \ReflectionClass(ProductServiceClient::class))
            ->getReflectionConstant('TIMEOUT_SECONDS')
            ->getValue();

        $this->assertSame(5, $timeout);
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
