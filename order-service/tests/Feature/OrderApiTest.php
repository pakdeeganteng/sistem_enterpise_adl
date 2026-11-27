<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use LazilyRefreshDatabase;

    /**
     * Positive testing: successful order API operations.
     */
    public function test_returns_orders_and_items_from_index(): void
    {
        $order = $this->createOrder();

        $this->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonPath('data.0.id', $order->id)
            ->assertJsonPath('data.0.items.0.product_id', 12);
    }

    public function test_returns_one_order_with_its_items(): void
    {
        $order = $this->createOrder();

        $this->getJson("/api/v1/orders/{$order->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $order->id)
            ->assertJsonPath('data.items.0.quantity', 2);
    }

    public function test_creates_order_and_items_from_valid_payload(): void
    {
        $this->postJson('/api/v1/orders', [
            'user_id' => 7,
            'items' => [
                ['product_id' => 12, 'quantity' => 2],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('data.user_id', 7)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.items.0.product_id', 12)
            ->assertJsonPath('data.items.0.quantity', 2);

        $this->assertDatabaseHas('orders', ['user_id' => 7, 'status' => 'pending']);
        $this->assertDatabaseHas('order_items', ['product_id' => 12, 'quantity' => 2]);
    }

    public function test_updates_order_status(): void
    {
        $order = $this->createOrder();

        $this->putJson("/api/v1/orders/{$order->id}", [
            'status' => 'confirmed',
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'confirmed']);
    }

    public function test_replaces_order_items(): void
    {
        $order = $this->createOrder();

        $this->putJson("/api/v1/orders/{$order->id}", [
            'items' => [
                ['product_id' => 25, 'quantity' => 4],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.items.0.product_id', 25)
            ->assertJsonPath('data.items.0.quantity', 4);

        $this->assertDatabaseMissing('order_items', ['product_id' => 12]);
        $this->assertDatabaseHas('order_items', ['order_id' => $order->id, 'product_id' => 25, 'quantity' => 4]);
    }

    public function test_deletes_order_and_its_items(): void
    {
        $order = $this->createOrder();

        $this->deleteJson("/api/v1/orders/{$order->id}")->assertNoContent();

        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
        $this->assertDatabaseMissing('order_items', ['order_id' => $order->id]);
    }

    /**
     * Negative testing: invalid requests and missing orders are rejected.
     */
    public function test_returns_validation_errors_when_order_items_are_missing(): void
    {
        $this->postJson('/api/v1/orders', ['user_id' => 7])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items']);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_rejects_an_empty_user_id(): void
    {
        $this->postJson('/api/v1/orders', [
            'user_id' => '',
            'items' => [
                ['product_id' => 12, 'quantity' => 2],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);
    }

    public function test_rejects_an_invalid_user_id(): void
    {
        $this->postJson('/api/v1/orders', [
            'user_id' => 'not-an-integer',
            'items' => [
                ['product_id' => 12, 'quantity' => 2],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['user_id']);
    }

    public function test_rejects_a_quantity_of_zero(): void
    {
        $this->postJson('/api/v1/orders', [
            'user_id' => 7,
            'items' => [
                ['product_id' => 12, 'quantity' => 0],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items.0.quantity']);
    }

    public function test_rejects_an_invalid_product_id(): void
    {
        $this->postJson('/api/v1/orders', [
            'user_id' => 7,
            'items' => [
                ['product_id' => 'not-an-integer', 'quantity' => 2],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items.0.product_id']);
    }

    public function test_rejects_duplicate_product_ids(): void
    {
        $this->postJson('/api/v1/orders', [
            'user_id' => 7,
            'items' => [
                ['product_id' => 12, 'quantity' => 2],
                ['product_id' => 12, 'quantity' => 1],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['items.1.product_id']);
    }

    public function test_rejects_an_invalid_order_status(): void
    {
        $this->postJson('/api/v1/orders', [
            'user_id' => 7,
            'status' => 'invalid',
            'items' => [
                ['product_id' => 12, 'quantity' => 2],
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_returns_not_found_when_an_order_does_not_exist(): void
    {
        $this->getJson('/api/v1/orders/999999')->assertNotFound();
    }

    private function createOrder(): Order
    {
        $order = Order::create(['user_id' => 7, 'status' => 'pending']);
        $order->items()->create(['product_id' => 12, 'quantity' => 2]);

        return $order;
    }
}
