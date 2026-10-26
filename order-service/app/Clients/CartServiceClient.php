<?php

namespace App\Clients;

use App\Exceptions\ServiceCommunicationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class CartServiceClient
{
    private const TIMEOUT_SECONDS = 5;

    /**
     * @return array{user_id: int, items: array<int, array{product_id: int, quantity: int}>}
     */
    public function getCart(int $userId): array
    {
        $response = $this->send($userId, 'GET');
        $data = $this->responseData($response);

        if (! is_array($data) || ! isset($data['items']) || ! is_array($data['items'])) {
            throw new ServiceCommunicationException('Cart Service', 'response does not match the cart contract');
        }

        $items = [];

        foreach ($data['items'] as $item) {
            if (
                ! is_array($item)
                || ! isset($item['product_id'], $item['quantity'])
                || ! is_int($item['product_id'])
                || $item['product_id'] < 1
                || ! is_int($item['quantity'])
                || $item['quantity'] < 1
            ) {
                throw new ServiceCommunicationException('Cart Service', 'response contains an invalid cart item');
            }

            $items[] = [
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
            ];
        }

        return [
            'user_id' => $userId,
            'items' => $items,
        ];
    }

    public function clearCart(int $userId): int
    {
        $response = $this->send($userId, 'DELETE');
        $data = $this->responseData($response);

        if (
            ! is_array($data)
            || ! isset($data['deleted_items'])
            || ! is_int($data['deleted_items'])
            || $data['deleted_items'] < 0
        ) {
            throw new ServiceCommunicationException('Cart Service', 'response does not match the clear-cart contract');
        }

        return $data['deleted_items'];
    }

    private function send(int $userId, string $method): Response
    {
        $baseUrl = rtrim((string) config('services.cart.url'), '/');

        if ($userId < 1 || $baseUrl === '') {
            throw new ServiceCommunicationException('Cart Service', 'invalid user ID or service URL');
        }

        try {
            $response = Http::acceptJson()
                ->timeout(self::TIMEOUT_SECONDS)
                ->connectTimeout(self::TIMEOUT_SECONDS)
                ->send($method, "{$baseUrl}/carts/{$userId}");
        } catch (ConnectionException $exception) {
            throw new ServiceCommunicationException('Cart Service', 'connection failed or timed out', $exception);
        }

        if (! $response->successful()) {
            throw new ServiceCommunicationException(
                'Cart Service',
                "returned HTTP {$response->status()}",
            );
        }

        return $response;
    }

    private function responseData(Response $response): mixed
    {
        $body = $response->json();

        if (! is_array($body) || ! array_key_exists('data', $body)) {
            throw new ServiceCommunicationException('Cart Service', 'response is not valid JSON or has no data field');
        }

        return $body['data'];
    }
}
