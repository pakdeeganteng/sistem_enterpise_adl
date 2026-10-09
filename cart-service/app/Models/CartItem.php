<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CartItem extends Model
{
    protected $fillable = [
        'user_id',
        'product_id',
        'quantity',
    ];

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId)->latest();
    }
}
