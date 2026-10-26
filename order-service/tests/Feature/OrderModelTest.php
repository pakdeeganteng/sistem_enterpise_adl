<?php

namespace Tests\Feature;

use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_orders_default_to_pending_and_load_their_items(): void
    {
        $order = Order::query()->create([
            'user_id' => 12,
            'total_amount' => '25.50',
        ]);

        $item = $order->items()->create([
            'product_id' => 34,
            'product_name' => 'Example product',
            'unit_price' => '12.75',
            'quantity' => 2,
            'subtotal' => '25.50',
        ]);

        $loadedOrder = Order::findWithItems($order->id);

        $this->assertNotNull($loadedOrder);
        $this->assertSame('PENDING', $loadedOrder->status);
        $this->assertSame('25.50', $loadedOrder->total_amount);
        $this->assertTrue($loadedOrder->relationLoaded('items'));
        $this->assertCount(1, $loadedOrder->items);
        $this->assertSame($item->id, $loadedOrder->items->first()->id);
        $this->assertSame($order->id, $item->order->id);
        $this->assertSame('12.75', $item->unit_price);
        $this->assertSame('25.50', $item->subtotal);
    }
}
