<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListUserOrdersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['sometimes', 'required', 'string', 'in:PENDING,PAID'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Status harus PENDING atau PAID',
        ];
    }
}
