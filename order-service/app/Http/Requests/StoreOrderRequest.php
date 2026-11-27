<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => 'required|integer|min:1',
            'status' => 'sometimes|in:pending,confirmed,processing,shipped,delivered,cancelled',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|min:1|distinct',
            'items.*.quantity' => 'required|integer|min:1',
        ];
    }
}
