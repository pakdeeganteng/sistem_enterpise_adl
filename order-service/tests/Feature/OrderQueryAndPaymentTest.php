<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class OrderQueryAndPaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_returns_the_order_service_status(): void
    {
        $this->getJson('/health')
            ->assertOk()
            ->assertExactJson([
                'status' => 'ok',
                'service' => 'order-service',
            ]);
    }

    public function test_order_detail_returns_the_order_and_eager_loaded_items(): void
    {
        $order = $this->createOrderWithItem(7);

        $this->getJson("/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Berhasil mengambil pesanan')
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.items.0.product_name', 'USB Hub');
    }

    public function test_missing_and_non_numeric_order_ids_return_not_found(): void
    {
        $this->getJson('/orders/999')
            ->assertNotFound()
            ->assertJsonStructure(['message']);

        $this->getJson('/orders/not-a-number')
            ->assertNotFound()
            ->assertJsonStructure(['message']);
    }

    public function test_user_orders_are_newest_first_and_include_items(): void
    {
        $older = $this->createOrderWithItem(7, 'PENDING');
        $older->forceFill(['created_at' => now()->subDay()])->save();
        $newer = $this->createOrderWithItem(7, 'PAID');
        $this->createOrderWithItem(8, 'PENDING');

        $this->getJson('/orders/user/7')
            ->assertOk()
            ->assertJsonPath('message', 'Berhasil mengambil daftar pesanan')
            ->assertJsonPath('data.0.id', $newer->id)
            ->assertJsonPath('data.0.items.0.product_name', 'USB Hub')
            ->assertJsonPath('data.1.id', $older->id)
            ->assertJsonCount(2, 'data');

        $this->getJson('/orders/user/7?status=PENDING')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $older->id)
            ->assertJsonPath('data.0.items.0.product_id', 34);

        $this->getJson('/orders/user/7?status=PAID')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $newer->id);
    }

    public function test_invalid_user_order_status_returns_validation_error(): void
    {
        $this->getJson('/orders/user/7?status=CANCELLED')
            ->assertUnprocessable()
            ->assertJsonStructure(['message', 'errors' => ['status']]);
    }

    public function test_payment_changes_pending_order_to_paid_and_returns_items(): void
    {
        $order = $this->createOrderWithItem(7);

        $this->patchJson("/orders/{$order->id}/pay")
            ->assertOk()
            ->assertJsonPath('message', 'Pesanan berhasil dibayar')
            ->assertJsonPath('data.status', 'PAID')
            ->assertJsonPath('data.items.0.product_name', 'USB Hub');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'PAID',
        ]);
    }

    public function test_payment_rejects_missing_non_numeric_and_already_paid_orders(): void
    {
        Log::spy();
        $paidOrder = $this->createOrderWithItem(7, 'PAID');

        $this->patchJson('/orders/999/pay')
            ->assertNotFound()
            ->assertJsonStructure(['message']);

        $this->patchJson('/orders/not-a-number/pay')
            ->assertNotFound()
            ->assertJsonStructure(['message']);

        $this->patchJson("/orders/{$paidOrder->id}/pay")
            ->assertConflict()
            ->assertJsonPath('message', 'Pesanan sudah dibayar');

        Log::shouldHaveReceived('warning')
            ->with('Payment status transition was rejected.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'mark_order_paid'
                    && $context['order_id'] === $paidOrder->id
                    && $context['user_id'] === 7
                    && $context['status'] === 'PAID'
                    && $context['service'] === 'Order Service',
            ))
            ->once();
    }

    public function test_unexpected_database_errors_return_generic_500_responses(): void
    {
        config(['app.debug' => false]);
        Log::spy();

        $orderService = Mockery::mock(OrderService::class);
        $orderService->shouldReceive('getOrder')->once()->andThrow(new RuntimeException('private database detail'));
        $orderService->shouldReceive('getUserOrders')->once()->andThrow(new RuntimeException('private database detail'));
        $orderService->shouldReceive('markPaid')->once()->andThrow(new RuntimeException('private database detail'));
        $this->app->instance(OrderService::class, $orderService);

        $this->getJson('/orders/1')
            ->assertInternalServerError()
            ->assertExactJson(['message' => 'Gagal mengambil pesanan']);

        $this->getJson('/orders/user/7')
            ->assertInternalServerError()
            ->assertExactJson(['message' => 'Gagal mengambil daftar pesanan']);

        $this->patchJson('/orders/1/pay')
            ->assertInternalServerError()
            ->assertExactJson(['message' => 'Gagal memperbarui status pesanan']);

        Log::shouldHaveReceived('error')
            ->with('Unexpected error while mengambil pesanan.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'mengambil pesanan'
                    && $context['order_id'] === 1
                    && $context['service'] === 'Order Service'
                    && ! array_key_exists('private database detail', $context),
            ))
            ->once();
        Log::shouldHaveReceived('error')
            ->with('Unexpected error while mengambil daftar pesanan.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'mengambil daftar pesanan'
                    && $context['user_id'] === 7
                    && $context['service'] === 'Order Service',
            ))
            ->once();
        Log::shouldHaveReceived('error')
            ->with('Unexpected error while memperbarui status pesanan.', Mockery::on(
                fn (array $context): bool => $context['operation'] === 'memperbarui status pesanan'
                    && $context['order_id'] === 1
                    && $context['service'] === 'Order Service',
            ))
            ->once();
    }

    public function test_debug_mode_exposes_internal_error_details(): void
    {
        config(['app.debug' => true]);

        $orderService = Mockery::mock(OrderService::class);
        $orderService->shouldReceive('getOrder')
            ->once()
            ->andThrow(new RuntimeException('database password or stack trace'));
        $this->app->instance(OrderService::class, $orderService);

        $response = $this->getJson('/orders/1')
            ->assertInternalServerError()
            ->assertJsonPath('message', 'Gagal mengambil pesanan')
            ->assertJsonPath('error', 'database password or stack trace')
            ->assertJsonPath('exception', RuntimeException::class)
            ->assertJsonStructure(['location']);

        $this->assertStringContainsString('database password', $response->getContent());
        $this->assertStringContainsString(RuntimeException::class, $response->getContent());
    }

    private function createOrderWithItem(int $userId, string $status = 'PENDING'): Order
    {
        $order = Order::query()->create([
            'user_id' => $userId,
            'status' => $status,
            'total_amount' => '25.50',
        ]);

        $order->items()->create([
            'product_id' => 34,
            'product_name' => 'USB Hub',
            'unit_price' => '12.75',
            'quantity' => 2,
            'subtotal' => '25.50',
        ]);

        return $order;
    }
}
