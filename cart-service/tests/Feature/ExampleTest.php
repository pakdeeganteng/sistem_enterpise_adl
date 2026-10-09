<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class ExampleTest extends TestCase
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

    /**
     * A basic test example.
     */
    public function test_the_application_health_endpoint_returns_a_successful_response(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }

    public function test_invalid_cart_item_requests_return_json_validation_errors(): void
    {
        $response = $this->post('/carts', [
            'user_id' => 1,
            'quantity' => 0,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['product_id', 'quantity']);
    }

    public function test_non_numeric_cart_user_id_returns_a_json_not_found_response(): void
    {
        $response = $this->get('/carts/not-a-number');

        $response->assertNotFound()
            ->assertJsonStructure(['message']);
    }

    public function test_cart_endpoints_add_and_increment_the_same_product(): void
    {
        $payload = ['user_id' => 1, 'product_id' => 1, 'quantity' => 2];

        $this->postJson('/carts', $payload)
            ->assertCreated()
            ->assertJsonPath('data.quantity', 2);

        $this->postJson('/carts', $payload)
            ->assertOk()
            ->assertJsonPath('data.quantity', 4);

        $this->getJson('/carts/1')
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 4);
    }

    public function test_missing_cart_items_return_json_not_found_responses(): void
    {
        $this->putJson('/carts/items/999', ['quantity' => 1])
            ->assertNotFound()
            ->assertJsonPath('message', 'Item keranjang dengan id 999 tidak ditemukan');

        $this->deleteJson('/carts/items/999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Item keranjang dengan id 999 tidak ditemukan');
    }
}
