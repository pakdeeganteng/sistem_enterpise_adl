<?php

namespace Tests\Unit;

use App\Exceptions\CartItemNotFoundException;
use App\Models\CartItem;
use App\Services\CartService;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CartServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('cart_items');
        Schema::create('cart_items', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();
            $table->unique(['user_id', 'product_id']);
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('cart_items');

        parent::tearDown();
    }

    public function test_add_item_increments_existing_product_and_returns_cart_summary(): void
    {
        $service = new CartService;

        $service->addItem(7, 42, 2);
        $item = $service->addItem(7, 42, 3);
        $service->addItem(8, 42, 4);
        $cart = $service->getCart(7);

        $this->assertSame(5, $item->quantity);
        $this->assertSame(['user_id', 'items', 'total_quantity'], array_keys($cart));
        $this->assertSame(7, $cart['user_id']);
        $this->assertSame(5, $cart['total_quantity']);
        $this->assertCount(1, $cart['items']);
    }

    public function test_update_quantity_changes_the_item_and_throws_when_missing(): void
    {
        $service = new CartService;
        $item = $service->addItem(7, 42, 2);

        $updatedItem = $service->updateQuantity($item->id, 6);

        $this->assertSame(6, $updatedItem->quantity);
        $this->expectException(CartItemNotFoundException::class);
        $service->updateQuantity(999, 1);
    }

    public function test_remove_item_throws_when_missing(): void
    {
        $service = new CartService;
        $item = $service->addItem(7, 42, 2);
        $service->addItem(8, 42, 3);

        $service->removeItem($item->id);

        $this->assertNull(CartItem::find($item->id));
        $this->expectException(CartItemNotFoundException::class);
        $service->removeItem($item->id);
    }

    public function test_clear_cart_returns_deleted_count_and_keeps_other_users_items(): void
    {
        $service = new CartService;
        $service->addItem(7, 42, 2);
        $otherUsersItem = $service->addItem(8, 42, 3);

        $this->assertSame(1, $service->clearCart(7));
        $this->assertSame($otherUsersItem->id, CartItem::query()->value('id'));
    }
}
