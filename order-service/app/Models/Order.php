<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'status',
        'total_amount',
    ];

    protected $attributes = [
        'status' => 'PENDING',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'total_amount' => 'decimal:2',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public static function findWithItems(int $id): ?self
    {
        return static::query()->with('items')->find($id);
    }
}
