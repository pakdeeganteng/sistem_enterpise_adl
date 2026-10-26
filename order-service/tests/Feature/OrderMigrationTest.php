<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class OrderMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_tables_have_decimal_money_columns_and_order_item_foreign_key(): void
    {
        $this->assertTrue(Schema::hasColumns('orders', [
            'id',
            'user_id',
            'status',
            'total_amount',
            'created_at',
            'updated_at',
        ]));
        $this->assertTrue(Schema::hasColumns('order_items', [
            'id',
            'order_id',
            'product_id',
            'product_name',
            'unit_price',
            'quantity',
            'subtotal',
        ]));

        // SQLite represents DECIMAL affinity as NUMERIC; PostgreSQL DECIMAL is not exercised here.
        $this->assertSame('numeric', Schema::getColumnType('orders', 'total_amount'));
        $this->assertSame('numeric', Schema::getColumnType('order_items', 'unit_price'));
        $this->assertSame('numeric', Schema::getColumnType('order_items', 'subtotal'));

        $foreignKeys = DB::select("PRAGMA foreign_key_list('order_items')");

        $this->assertTrue(collect($foreignKeys)->contains(
            fn (object $foreignKey): bool => $foreignKey->table === 'orders'
                && $foreignKey->from === 'order_id'
                && $foreignKey->to === 'id',
        ));
    }
}
