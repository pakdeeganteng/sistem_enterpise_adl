<?php

namespace App\Clients;

use App\Exceptions\ProductNotFoundException;
use App\Exceptions\ServiceCommunicationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;

class ProductServiceClient
{
    private const TIMEOUT_SECONDS = 5;

    /**
     * @return array{name: string, price: int|float|string, stock: int}
     */
    public function getProduct(int $productId): array
    {
        $baseUrl = rtrim((string) config('services.product.url'), '/');

        if ($productId < 1 || $baseUrl === '') {
            throw new ServiceCommunicationException('Product Service', 'invalid product ID or service URL');
        }

        try {
            $response = Http::acceptJson()
                ->timeout(self::TIMEOUT_SECONDS)
                ->connectTimeout(self::TIMEOUT_SECONDS)
                ->get("{$baseUrl}/products/{$productId}");
        } catch (ConnectionException $exception) {
            throw new ServiceCommunicationException('Product Service', 'connection failed or timed out', $exception);
        }

        if ($response->status() === 404) {
            throw new ProductNotFoundException($productId);
        }

        if (! $response->successful()) {
            throw new ServiceCommunicationException(
                'Product Service',
                "returned HTTP {$response->status()}",
            );
        }

        $body = $response->json();
        $product = is_array($body) ? ($body['data'] ?? null) : null;

        if (
            ! is_array($product)
            || ! isset($product['name'], $product['price'], $product['stock'])
            || ! is_string($product['name'])
            || trim($product['name']) === ''
            || (! is_int($product['price']) && ! is_float($product['price']) && ! is_string($product['price']))
            || ! is_numeric($product['price'])
            || ! is_finite((float) $product['price'])
            || (float) $product['price'] < 0
            || ! is_int($product['stock'])
            || $product['stock'] < 0
        ) {
            throw new ServiceCommunicationException('Product Service', 'response does not match the product contract');
        }

        return [
            'name' => $product['name'],
            'price' => $product['price'],
            'stock' => $product['stock'],
        ];
    }
}
