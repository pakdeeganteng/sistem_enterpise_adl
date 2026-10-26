<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'order_id' => (int) $this->order_id,
            'product_id' => (int) $this->product_id,
            'product_name' => $this->product_name,
            'unit_price' => $this->amountAsNumber($this->unit_price),
            'quantity' => (int) $this->quantity,
            'subtotal' => $this->amountAsNumber($this->subtotal),
        ];
    }

    private function amountAsNumber(string|int|float $amount): int|float
    {
        $value = (string) $amount;

        if (! str_contains($value, '.')) {
            return (int) $value;
        }

        $value = rtrim(rtrim($value, '0'), '.');

        return str_contains($value, '.') ? (float) $value : (int) $value;
    }
}
