<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'user_id' => (int) $this->user_id,
            'status' => $this->status,
            'total_amount' => $this->amountAsNumber($this->total_amount),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
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
